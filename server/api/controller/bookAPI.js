const bookSchema = require("../models/books");
const userSchema = require("../models/user");

exports.addBook = async (req, res) => {
    try {
        const BibNum = req.body.BibNum;
        const Title = req.body.Title;
        const ItemCount = req.body.ItemCount;
        // const password = req.body.password
        const Author = req.body.Author;
        const ISBN = req.body.ISBN;
        const Publisher = req.body.Publisher;
        const Genre = req.body.Genre;

        let doc = await bookSchema.findOne({ ISBN: ISBN })
        if (!doc) {
            const book = new bookSchema({
                BibNum: BibNum,
                Title: Title,
                ItemCount: ItemCount,
                Author: Author,
                ISBN: ISBN,
                Publisher: Publisher,
                Genre: Genre
            });
            await book.save();
            return res.status(200).json({ msg: "Book Added SuccessFully" });

        } else if (doc) {
            return res.status(400).json({ msg: " Book Already Exist" });
        }
    }
    catch (error) {
        throw error;
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        const books = await bookSchema.find();
        return res.status(200).json({ books });
    } catch (error) {
        throw error;
    }
};

exports.searchBooks = async (req, res) => {
    try {
        const searchText = req.params.id;
        if (searchText == "-") {
            const books = await bookSchema.find();
            return res.status(200).json({ books });
        }
        const regex = new RegExp(searchText, 'i'); // 'i' flag for case-insensitive search
        const books = await bookSchema.find({ Title: { $regex: regex } }).limit(4);
        res.status(200).json({ books });
    } catch (error) {
        throw error;
    }
};


// exports.addToCart = async (req, res) => {
//     try {
//         const { username } = req.body;
//         const books = req.body.books;
//         if (!books || !Array.isArray(books) || books.length === 0) {
//             return res.status(400).json({ msg: "Invalid books array" });
//         }

//         const user = await userSchema.findOne({ username });

//         if (!user) {
//             return res.status(400).json({ msg: "User not found" });
//         }

//         for (let i = 0; i < books.length; i++) {
//             const ISBN = books[i];
//             const book = await bookSchema.findOne({ ISBN });

//             if (!book) {
//                 return res.status(400).json({ msg: `Book with ISBN ${ISBN} not found` });
//             }

//             if (book.ItemCount > 0) {
//                 // Decrease item count of the book
//                 // book.ItemCount -= 1;
//                 // await book.save();

//                 // Add ISBN to user's cart
//                 // user.cart.push(ISBN);
//                 user.cart.push({
//                     isbn: book.ISBN
//                 });
//             } else {
//                 return res.status(400).json({ msg: `Book with ISBN ${ISBN} is out of stock` });
//             }
//         }

//         await user.save();

//         return res.status(200).json({ msg: "Books added to cart successfully" });
//     } catch (error) {
//         throw error;
//     }
// };

exports.addToCart = async (req, res) => {
    try {
        const { username, books } = req.body;
        console.log(`Adding books to cart for user: ${username}, books:`, books);

        if (!books || !Array.isArray(books) || books.length === 0) {
            console.log("Invalid books array provided");
            return res.status(400).json({ msg: "Invalid books array" });
        }

        const user = await userSchema.findOne({ username });

        if (!user) {
            console.log("User not found:", username);
            return res.status(400).json({ msg: "User not found" });
        }

        for (let i = 0; i < books.length; i++) {
            const ISBN = books[i];
            const book = await bookSchema.findOne({ ISBN });

            if (!book) {
                console.log(`Book with ISBN ${ISBN} not found`);
                return res.status(400).json({ msg: `Book with ISBN ${ISBN} not found` });
            }

            if (book.ItemCount > 0) {
                user.cart.push({ isbn: book.ISBN });
                console.log(`Book with ISBN ${ISBN} added to cart`);
            } else {
                console.log(`Book with ISBN ${ISBN} is out of stock`);
                return res.status(400).json({ msg: `Book with ISBN ${ISBN} is out of stock` });
            }
        }

        await user.save();
        console.log(`Books added to cart successfully for user: ${username}`);
        return res.status(200).json({ msg: "Books added to cart successfully" });
    } catch (error) {
        console.error("Error in adding books to cart:", error);
        throw error;
    }
};


exports.checkout = async (req, res) => {
    try {
        const { username } = req.body;
        console.log(username);
        const user = await userSchema.findOne({ username });

        if (!user) {
            return res.status(400).json({ msg: "User not found" });
        }

        const booksInCart = user.cart;
        const borrowedBooks = [];

        for (let i = 0; i < booksInCart.length; i++) {
            const isbn = booksInCart[i].isbn;
            const book = await bookSchema.findOne({ ISBN: isbn });

            if (!book) {
                return res.status(400).json({ msg: `Book with ISBN ${isbn} not found` });
            }

            if (book.ItemCount > 0) {
                // Decrease item count of the book
                book.ItemCount -= 1;
                await book.save();

                // Add book to borrowed array
                borrowedBooks.push({
                    isbn: book.ISBN,
                    takenDate: new Date(),// Set the due date as per your requirements

                });
            } else {
                return res.status(400).json({ msg: `Book with ISBN ${isbn} is out of stock` });
            }
        }

        // Empty the user's cart and update the borrowed books
        user.cart = [];
        user.borrowed = [...user.borrowed, ...borrowedBooks];
        await user.save();

        return res.status(200).json({ msg: "Checkout successful" });
    } catch (error) {
        throw error;
    }

};

exports.returnBooks = async (req, res) => {
    try {
        const { uniqueId, isbn } = req.body;

        // Find the user
        const user = await userSchema.findOne({ uniqueId });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Find the books with the provided ISBNs
        const books = await bookSchema.find({ ISBN: { $in: isbn } });

        if (books.length === 0) {
            return res.status(404).json({ msg: 'No books found with the provided ISBN' });
        }

        // Remove the books from the user's borrowed array
        user.borrowed = user.borrowed.filter(book => !isbn.includes(book.isbn));

        // Increase the itemCount of the returned books
        for (const book of books) {
            book.ItemCount = 1;
            await book.save();
        }

        // Save the updated user
        await user.save();

        return res.status(200).json({ msg: 'Books returned successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
}


exports.removeFromCart = async (req, res) => {
    try {
        const { username, isbn } = req.body;

        // Find the user
        const user = await userSchema.findOne({ username });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Remove the book from the user's cart
        user.cart = user.cart.filter((book) => book.isbn !== isbn);

        // Save the updated user
        await user.save();

        return res.status(200).json({ msg: 'Book removed from cart successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
};

exports.filter = async (req, res) => {
    try {
        const genre = req.params.genre;
        const year = req.params.year;
        const title = req.params.title;

        const query = {};

        // Apply genre filter
        if (genre !== 'all') {
            query.genre = genre;
        }

        // Apply year filter
        if (year !== 'all') {
            query.year = year;
        }

        // Apply title filter
        if (title !== 'all') {
            query.title = { $regex: title, $options: 'i' };
        }

        // Find books based on the filter criteria
        const books = await bookSchema.find(query);

        return res.status(200).json({ books });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.booksInCart = async (req, res) => {
    try {
        const username = req.params.username;

        // Find the user
        const user = await userSchema.findOne({ username });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Extract ISBNs from the user's cart
        const isbnList = user.cart.map(book => book.isbn);

        // Find the books based on the extracted ISBNs
        const books = await bookSchema.find({ ISBN: { $in: isbnList } });

        if (books.length === 0) {
            return res.status(404).json({ msg: 'No books found' });
        }

        // Send the book details to the client
        return res.status(200).json({ books });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
};
exports.borrowedBooks = async (req, res) => {
    try {
        const users = await userSchema.find({ borrowed: { $exists: true, $ne: [] } });

        if (users.length === 0) {
            return res.status(404).json({ msg: "No borrowed books found" });
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
                console.log(bookDetails);
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

        return res.status(200).json(borrowedBooks);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}