/** Integration tests for books route */


process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");


// isbn of sample book
let bookIsbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (
        isbn, 
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year)
      VALUES(
        '123456789',
        'https://amazon.com/LaikaTheDogWriter',
        'Laika',
        'Doggo',
        10,
        'Puplisher',
        'How to get more treats', 2023)
      RETURNING isbn`);

  bookIsbn = result.rows[0].isbn
});

describe("GET all from /books", function() {
  test("Return all books in db", async function() {
    const response = await request(app).get(`/books`);
    expect(response.statusCode).toBe(200);
    expect(response.body.books[0].isbn).toBe('123456789');
    expect(response.body.books[0]).toHaveProperty('author');
  });
});

describe("GET /books/:isbn", function() {
  test("Get 1 book", async function() {
    const response = await request(app).get(`/books/${bookIsbn}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.book.isbn).toBe(bookIsbn);
  })

  test("Check error handling if book isbn does not exist", async function() {
    const response = await request(app).get(`/books/dfahiea`);
    expect(response.statusCode).toBe(404);
  })
})

describe("POST /books", function() {
  test("Add a new book to the db", async function() {
    const response = await request(app).post(`/books`).send({
      isbn: `111111111`,
      amazon_url: `http://bobo.net`,
      author: `Bobo`,
      language: `Doggo`,
      pages: 3,
      publisher: `Puplisher`,
      title: `Digging Holes`,
      year: 2010
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.book.isbn).toBe(`111111111`);
  });

  test("Test error handling, missing properties", async function() {
    const response = await request(app).post(`/books`).send({
      isbn: `111111111`,
      title: `Digging Holes`
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe(`instance requires property "amazon_url"`);
  });
});

describe("PUT /books/:isbn", function() {
  test("Update a single book", async function() {
    const response = await request(app).put(`/books/${bookIsbn}`).send({
      isbn: `123456789`,
      amazon_url: `https://LaikaTheDogWriter.com`,
      author: `Laika`,
      language: `Doggo`,
      pages: 23000,
      publisher: `Puplisher`,
      title: `Digging Holes`,
      year: 2023      
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.book.pages).toBe(23000);
    expect(response.body.book.amazon_url).toBe(`https://LaikaTheDogWriter.com`);
  });

  test("Test error handling, missing object properties", async function() {
    const response = await request(app).put(`/books/${bookIsbn}`).send({
      isbn: `123456789`,
      year: 2023      
    });    
    expect(response.statusCode).toBe(400);
  });

  test("Test error handling, too many object properties", async function() {
    const response = await request(app).put(`/books/${bookIsbn}`).send({
      isbn: `123456789`,
      amazon_url: `https://LaikaTheDogWriter.com`,
      author: `Laika`,
      language: `Doggo`,
      pages: 23000,
      publisher: `Puplisher`,
      title: `Digging Holes`,
      year: 2023,
      price: 19.99
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe(`instance is not allowed to have the additional property "price"`);
  });  
});

describe("DELETE /books/:isbn", function () {
  test("Deletes book", async function () {
    const response = await request(app).delete(`/books/${bookIsbn}`);
    expect(response.body).toEqual({message: "Book deleted"});
  });
});

afterEach(async function () {
  await db.query("DELETE FROM books");
});


afterAll(async function () {
  await db.end()
});