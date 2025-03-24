import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const dp = new pg.Client({
  user: "postgres",
  host: "localhost",
  password: "...",
  database: "world",
  port: 5433,
});

dp.connect();

let countries = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await dp.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

app.post("/add", async (req, res) => {
  let resultCountryCode;
  const countryName = req.body.country;
  resultCountryCode = await dp.query(
    `SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1;`,
    ["%" + countryName.toLowerCase() + "%"]
  );
  if (resultCountryCode.rows.length > 1) {
    const countries = await checkVisited();
    res.render("index.ejs", {
      error: "There is no such country, bro.",
      total: countries.length,
      countries: countries,
    });
  } else if (resultCountryCode.rows.length !== 0) {
    try {
      const countryCode = resultCountryCode.rows[0].country_code;
      await dp.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1);",
        [countryCode]
      );
      res.redirect("/");
    } catch {
      const countries = await checkVisited();
      res.render("index.ejs", {
        error: "You've already added it.",
        total: countries.length,
        countries: countries,
      });
    }
  } else {
    const countries = await checkVisited();
    res.render("index.ejs", {
      error:
        "There is no such country, don't mess around. And start with a capital letter.",
      total: countries.length,
      countries: countries,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
