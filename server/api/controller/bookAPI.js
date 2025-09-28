const bookSchema = require("../models/books");
const userSchema = require("../models/user");
const { catchAsync, AppError } = require('../../middleware/errorHandler');

// Updated addBook with error handling and validation
exports.addBook = catchAsync(async (req, res, next) => {
    const { BibNum, Title, ItemCount, Author, ISBN, Publisher, Genre } = req.body;

    // Check if book already exists
    const existingBook = await bookSchema.findOne({ ISBN: ISBN });
    if (existingBook) {
        return next(new AppError('Book Already Exists', 409, 'DUPLICATE_ISBN'));
    }

    const book = new bookSchema({
        BibNum,
        Title,
        ItemCount,
        Author,
        ISBN,
        Publisher,
        Genre
    });

    await book.save();
    
    res.status(201).json({
        success: true,
        message: "Book Added Successfully",
        data: { book }
    });
});

exports.getAllBooks = catchAsync(async (req, res, next) => {
    const books = await bookSchema.find();
    
    res.status(200).json({
        success: true,
        data: { books }
    });
});

exports.searchBooks = catchAsync(async (req, res, next) => {
    const searchText = req.params.id;
    
    let books;
    if (searchText === "-") {
        books = await bookSchema.find();
    } else {
        const regex = new RegExp(searchText, 'i');
        books = await bookSchema.find({ Title: { $regex: regex } }).limit(4);
    }
    
    res.status(200).json({
        success: true,
        data: { books }
    });
});

exports.addToCart = catchAsync(async (req, res, next) => {
    const { username, books } = req.body;
    
    if (!books || !Array.isArray(books) || books.length === 0) {
        return next(new AppError("Invalid books array", 400, 'INVALID_BOOKS_ARRAY'));
    }

    const user = await userSchema.findOne({ username });
    if (!user) {
        return next(new AppError("User not found", 404, 'USER_NOT_FOUND'));
    }

    for (let i = 0; i < books.length; i++) {
        const ISBN = books[i];
        const book = await bookSchema.findOne({ ISBN });

        if (!book) {
            return next(new AppError(`Book with ISBN ${ISBN} not found`, 404, 'BOOK_NOT_FOUND'));
        }

        if (book.ItemCount <= 0) {
            return next(new AppError(`Book with ISBN ${ISBN} is out of stock`, 400, 'OUT_OF_STOCK'));
        }

        user.cart.push({ isbn: book.ISBN });
    }

    await user.save();
    
    res.status(200).json({
        success: true,
        message: "Books added to cart successfully"
    });
});

exports.checkout = catchAsync(async (req, res, next) => {
    const { username } = req.body;
    
    const user = await userSchema.findOne({ username });
    if (!user) {
        return next(new AppError("User not found", 404, 'USER_NOT_FOUND'));
    }

    const booksInCart = user.cart;
    const borrowedBooks = [];

    for (let i = 0; i < booksInCart.length; i++) {
        const isbn = booksInCart[i].isbn;
        const book = await bookSchema.findOne({ ISBN: isbn });

        if (!book) {
            return next(new AppError(`Book with ISBN ${isbn} not found`, 404, 'BOOK_NOT_FOUND'));
        }

        if (book.ItemCount <= 0) {
            return next(new AppError(`Book with ISBN ${isbn} is out of stock`, 400, 'OUT_OF_STOCK'));
        }

        // Decrease item count
        book.ItemCount -= 1;
        await book.save();

        borrowedBooks.push({
            isbn: book.ISBN,
            takenDate: new Date(),
        });
    }

    // Empty cart and update borrowed books
    user.cart = [];
    user.borrowed = [...user.borrowed, ...borrowedBooks];
    await user.save();

    res.status(200).json({
        success: true,
        message: "Checkout successful"
    });
});

exports.returnBooks = catchAsync(async (req, res, next) => {
    const { uniqueId, isbn } = req.body;

    const user = await userSchema.findOne({ uniqueId });
    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    const books = await bookSchema.find({ ISBN: { $in: isbn } });
    if (books.length === 0) {
        return next(new AppError('No books found with the provided ISBN', 404, 'BOOKS_NOT_FOUND'));
    }

    // Remove books from borrowed array
    user.borrowed = user.borrowed.filter(book => !isbn.includes(book.isbn));

    // Increase itemCount of returned books
    for (const book of books) {
        book.ItemCount += 1;
        await book.save();
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Books returned successfully'
    });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
    const { username, isbn } = req.body;

    const user = await userSchema.findOne({ username });
    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    user.cart = user.cart.filter((book) => book.isbn !== isbn);
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Book removed from cart successfully'
    });
});

exports.filter = catchAsync(async (req, res, next) => {
    const { genre, year, title } = req.params;
    const query = {};

    if (genre !== 'all') query.Genre = genre;
    if (year !== 'all') query.year = year;
    if (title !== 'all') query.Title = { $regex: title, $options: 'i' };

    const books = await bookSchema.find(query);
    
    res.status(200).json({
        success: true,
        data: { books }
    });
});

exports.booksInCart = catchAsync(async (req, res, next) => {
    const { username } = req.params;

    const user = await userSchema.findOne({ username });
    if (!user) {
        return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    const isbnList = user.cart.map(book => book.isbn);
    const books = await bookSchema.find({ ISBN: { $in: isbnList } });

    if (books.length === 0) {
        return next(new AppError('No books found in cart', 404, 'NO_BOOKS_IN_CART'));
    }

    res.status(200).json({
        success: true,
        data: { books }
    });
});

exports.borrowedBooks = catchAsync(async (req, res, next) => {
    const users = await userSchema.find({ borrowed: { $exists: true, $ne: [] } });

    if (users.length === 0) {
        return next(new AppError("No borrowed books found", 404, 'NO_BORROWED_BOOKS'));
    }

    const borrowedBooks = [];

    for (const user of users) {
        for (const book of user.borrowed) {
            const borrowedBook = {
                isbn: book.isbn,
                title: "",
                author: "",
                uid: user.uniqueId,
                borrower: user.name,
                takenDate: book.takenDate,
            };

            const bookDetails = await bookSchema.findOne({ ISBN: book.isbn });
            if (bookDetails) {
                borrowedBook.title = bookDetails.Title;
                borrowedBook.author = bookDetails.Author;
            } else {
                borrowedBook.title = "Unknown";
                borrowedBook.author = "Unknown";
            }

            borrowedBooks.push(borrowedBook);
        }
    }

    res.status(200).json({
        success: true,
        data: borrowedBooks
    });
});
