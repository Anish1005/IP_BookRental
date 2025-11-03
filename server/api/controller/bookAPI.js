// ==============================
// bookAPI.js
// ==============================

// Core Imports
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");

// Models
const bookSchema = require("../models/books");
const userSchema = require("../models/user");
const Book = require("../models/books");

// App setup for sanitization and security
const app = express();
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json({ limit: "10kb" }));

// ==============================
// Validation Middleware
// ==============================
exports.validateBook = [
  body("BibNum").trim().notEmpty().isNumeric().withMessage("BibNum must be numeric"),
  body("Title").trim().escape().notEmpty().isLength({ min: 2 }),
  body("Author").trim().escape().notEmpty().isLength({ min: 2 }),
  body("Publisher").trim().escape().notEmpty(),
  body("Genre").trim().escape().notEmpty(),
  body("ISBN").trim().escape().notEmpty().isISBN().withMessage("Invalid ISBN"),
  body("ItemCount").isInt({ min: 0 })
];

// ==============================
// Centralized Error Handling
// ==============================
class AppError extends Error {
  constructor(message, statusCode, code = "GENERIC_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || "SERVER_ERROR"
  });
};

// ==============================
// Controller Functions
// ==============================

// ADD BOOK (with validation + consistent error response)
exports.addBook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { BibNum, Title, Author, Publisher, Genre, ISBN, ItemCount } = req.body;

    if (await Book.findOne({ ISBN })) {
      return res.status(409).json({
        success: false,
        message: "Duplicate ISBN",
        code: "DUPLICATE_ISBN"
      });
    }

    const savedBook = await new Book({
      BibNum,
      Title,
      Author,
      Publisher,
      Genre,
      ISBN,
      ItemCount
    }).save();

    res.status(201).json({
      success: true,
      message: "Book Added Successfully",
      data: { book: savedBook }
    });
  } catch (err) {
    next(err);
  }
};

// GET ALL BOOKS
exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await bookSchema.find();
    return res.status(200).json({ success: true, books });
  } catch (error) {
    next(error);
  }
};

// SEARCH BOOKS
exports.searchBooks = async (req, res, next) => {
  try {
    const searchText = req.params.id;
    if (searchText === "-") {
      const books = await bookSchema.find();
      return res.status(200).json({ success: true, books });
    }

    const regex = new RegExp(searchText, "i");
    const books = await bookSchema.find({ Title: { $regex: regex } }).limit(4);
    res.status(200).json({ success: true, books });
  } catch (error) {
    next(error);
  }
};

// ADD TO CART
exports.addToCart = async (req, res, next) => {
  try {
    const { username, books } = req.body;
    console.log(`Adding books to cart for user: ${username}, books:`, books);

    if (!books || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, msg: "Invalid books array" });
    }

    const user = await userSchema.findOne({ username });
    if (!user) return res.status(400).json({ success: false, msg: "User not found" });

    for (const ISBN of books) {
      const book = await bookSchema.findOne({ ISBN });
      if (!book) return res.status(400).json({ success: false, msg: `Book with ISBN ${ISBN} not found` });

      if (book.ItemCount > 0) {
        user.cart.push({ isbn: book.ISBN });
      } else {
        return res.status(400).json({ success: false, msg: `Book with ISBN ${ISBN} is out of stock` });
      }
    }

    await user.save();
    res.status(200).json({ success: true, msg: "Books added to cart successfully" });
  } catch (error) {
    next(error);
  }
};

// CHECKOUT
exports.checkout = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await userSchema.findOne({ username });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const borrowedBooks = [];

    for (const cartItem of user.cart) {
      const book = await bookSchema.findOne({ ISBN: cartItem.isbn });
      if (!book) return res.status(400).json({ msg: `Book with ISBN ${cartItem.isbn} not found` });

      if (book.ItemCount > 0) {
        book.ItemCount -= 1;
        await book.save();

        borrowedBooks.push({
          isbn: book.ISBN,
          takenDate: new Date()
        });
      } else {
        return res.status(400).json({ msg: `Book with ISBN ${cartItem.isbn} is out of stock` });
      }
    }

    user.cart = [];
    user.borrowed = [...user.borrowed, ...borrowedBooks];
    await user.save();

    res.status(200).json({ success: true, msg: "Checkout successful" });
  } catch (error) {
    next(error);
  }
};

// RETURN BOOKS
exports.returnBooks = async (req, res, next) => {
  try {
    const { uniqueId, isbn } = req.body;
    const user = await userSchema.findOne({ uniqueId });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const books = await bookSchema.find({ ISBN: { $in: isbn } });
    if (books.length === 0) return res.status(404).json({ msg: "No books found with provided ISBNs" });

    user.borrowed = user.borrowed.filter(book => !isbn.includes(book.isbn));
    for (const book of books) {
      book.ItemCount = 1;
      await book.save();
    }

    await user.save();
    res.status(200).json({ success: true, msg: "Books returned successfully" });
  } catch (error) {
    next(error);
  }
};

// REMOVE FROM CART
exports.removeFromCart = async (req, res, next) => {
  try {
    const { username, isbn } = req.body;
    const user = await userSchema.findOne({ username });

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.cart = user.cart.filter(book => book.isbn !== isbn);
    await user.save();

    res.status(200).json({ success: true, msg: "Book removed from cart successfully" });
  } catch (error) {
    next(error);
  }
};

// FILTER BOOKS
exports.filter = async (req, res, next) => {
  try {
    const { genre, year, title } = req.params;
    const query = {};

    if (genre !== "all") query.Genre = genre;
    if (year !== "all") query.Year = year;
    if (title !== "all") query.Title = { $regex: title, $options: "i" };

    const books = await bookSchema.find(query);
    res.status(200).json({ success: true, books });
  } catch (error) {
    next(error);
  }
};

// BOOKS IN CART
exports.booksInCart = async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await userSchema.findOne({ username });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const isbnList = user.cart.map(book => book.isbn);
    const books = await bookSchema.find({ ISBN: { $in: isbnList } });

    if (books.length === 0) return res.status(404).json({ msg: "No books found" });

    res.status(200).json({ success: true, books });
  } catch (error) {
    next(error);
  }
};

// BORROWED BOOKS
exports.borrowedBooks = async (req, res, next) => {
  try {
    const users = await userSchema.find({ borrowed: { $exists: true, $ne: [] } });
    if (users.length === 0) return res.status(404).json({ msg: "No borrowed books found" });

    const borrowedBooks = [];
    for (const user of users) {
      for (const book of user.borrowed) {
        const details = await bookSchema.findOne({ ISBN: book.isbn });
        borrowedBooks.push({
          isbn: book.isbn,
          title: details ? details.Title : "Unknown",
          author: details ? details.Author : "Unknown",
          uid: user.uniqueId,
          borrower: user.name,
          takenDate: book.takenDate
        });
      }
    }

    res.status(200).json({ success: true, borrowedBooks });
  } catch (error) {
    next(error);
  }
};

// ==============================
// Export Error Handler
// ==============================
module.exports.errorHandler = errorHandler;
module.exports.AppError = AppError;
