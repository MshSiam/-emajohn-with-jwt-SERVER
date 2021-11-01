const express = require("express")
const { MongoClient } = require("mongodb")
const app = express()
const cors = require("cors")
const port = process.env.PORT || 5000
require("dotenv").config()

app.get("/", (req, res) => {
  res.send("server is online")
})

// middlewere
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.woosd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

console.log(uri)

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

async function run() {
  try {
    await client.connect()
    const database = client.db("online_shop")
    const productCollection = database.collection("products")
    const orderCollection = database.collection("orders")

    // Get products api
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find({})
      const page = req.query.page
      const size = parseInt(req.query.size)
      let products
      const count = await cursor.count()

      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray()
      } else {
        products = await cursor.toArray()
      }

      res.send({
        count,
        products
      })
    })

    // Use POST to get data by key
    app.post("/products/byKeys", async (req, res) => {
      const keys = req.body
      const query = { key: { $in: keys } }
      const products = await productCollection.find(query).toArray()
      res.json(products)
    })

    //add Order api
    app.post("/orders", async (req, res) => {
      const order = req.body
      // console.log("order", order)
      const result = await orderCollection.insertOne(order)
      res.json(result)
    })
  } finally {
    // await client.close()
  }
}

run().catch(console.dir)

app.listen(port, () => {
  console.log("server is running")
})
