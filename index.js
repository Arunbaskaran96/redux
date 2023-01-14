const express = require("express");
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoclient = mongodb.MongoClient;
const secret = "arun";
const URL =
  "mongodb+srv://admin:UrxMhEFy9DglLw9B@cluster0.xzj3rng.mongodb.net/?retryWrites=true&w=majority";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

const valid = (req, res, next) => {
  if (req.headers.authorization) {
    const verify = jwt.verify(req.headers.authorization, secret);
    try {
      if (verify) {
        next();
      }
    } catch (error) {
      res.status(401).json({ message: "unauthorized" });
    }
  } else {
    res.status(401).json({ message: "unauthorized" });
  }
};

app.get(
  "/products",
  valid,
  // (req, res, next) => {
  //   try {
  //     if (req.headers.authorization) {
  //       const verify = bcrypt.verify(req.headers.authorization, secret);
  //       try {
  //         if (verify) {
  //           next();
  //         }
  //       } catch (error) {
  //         console.log(error);
  //         res.status(501).json({ message: "unauthorized" });
  //       }
  //     } else {
  //       res.status(501).json({ message: "unauthorized" });
  //     }
  //   } catch (error) {}
  // },
  async (req, res) => {
    try {
      const connection = await mongoclient.connect(URL);
      const db = connection.db("delivero");
      const collection = db.collection("items");
      const operation = await collection.find({}).toArray();
      await connection.close();

      res.json(operation);
    } catch (error) {
      console.log(error);
    }
  }
);

app.post("/product", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("delivero");
    const collection = db.collection("items");
    const operation = await collection.insertOne(req.body);
    await connection.close();

    res.json({ message: "created" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/register", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("delivero");
    const collection = db.collection("login");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;
    const operation = await collection.insertOne(req.body);
    await connection.close();

    res.json({ message: "created" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("delivero");
    const collection = db.collection("login");
    const user = await collection.findOne({ email: req.body.email });
    if (user) {
      const compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: "5m" });
        res.json({ message: "user found", token });
      } else {
        res.json({ message: "email/password incorrect" });
      }
    } else {
      res.status(401).json({ message: "user not found" });
    }
    await connection.close();

    res.json(user);
  } catch (error) {
    console.log(error);
  }
});

app.listen(8000);
