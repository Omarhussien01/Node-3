import fetch from "node-fetch";
import express from 'express';
import { object, string, number } from "yup";
import axios from "axios";


const app = express();

const productScheme = object({
  title: string("this should be a string").required(),
  price: number("this should be anumber").positive().required(),
  description: string("this should be a string"),
  categoryId: number("this should be anumber").positive().required().integer(),
})


const _fetch = (url) => fetch(url).then((res) => res.json());

const groupWithCategory = (products) => {
  const categorized = {};

  products.forEach((element) => {
    if (categorized[element.category.id]) {
      categorized[element.category.id].products.push(element);
    } else {
      categorized[element.category.id] = {
        category: {
          id: element.category.id,
          name: element.category.name,
        },
        products: [element],
      };
    }
  });

  return Object.values(categorized);
};

const transferCurrency = (products, rate) => {
  return products.map((el) => ({ ...el, price: (el.price * rate).toFixed(2) }));
};

const categorizeProducts = async (curencyCode) => {
  const [products, code] = await Promise.all([
    _fetch("https://api.escuelajs.co/api/v1/products?offset=1&limit=10"),
    _fetch("https://api.exchangerate.host/latest?base=USD").then(
      (res) => res.rates[curencyCode]
    ),
  ]);

  const transformedPrices = transferCurrency(products, code);
  const categorizedProducts = groupWithCategory(transformedPrices);
  return categorizedProducts;
};

app.get('/', async (req,res)=>{
  try {
    const curency=req.query.cur;
    if(!curency){
      res.status(400).send("Curency not found in the url")
      return;
    }
   
    //res.send(await categorizeProducts(curency));
    res.json(await categorizeProducts(curency))


    
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
  })

  app.post('/',async (req,res)=>{
    
  const { body } = req.body;

  try {
    const data = registerUserSchema.validateSync(body, { abortEarly: false, stripUnknown: true });
    (async () => {
      let postResponse =await axios.post("https://api.escuelajs.co/api/v1/products/", data, {
      headers: { 'Content-Type': 'application/json' }
      });
      res.setHeader("content-type", "application/json");
      res.writeHead(201);
      res.write(JSON.stringify(postResponse.data));
      res.end();
   })();

    return res.json({ message: 'Success', data });
  } catch (e) {
    

    return res.status(422).json({ errors: error.errors });
  }
  })
  app.listen(8000,()=>{
    console.log("Server is running on port 8000");
  })

