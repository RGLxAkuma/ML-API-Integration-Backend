import got from "got";
import express from "express";
import cors from "cors";
import { google } from "googleapis";
import { FormData } from "formdata-node";
import {} from "dotenv/config";
// require("dotenv").config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json({ limit: "50mb" })); // express acts as a middleware
app.use(cors()); //To avaoid local host API calling errors

const API_KEY = process.env.GOOGLE_API_KEY; //API key corresponding to Perspective API
const DISCOVERY_URL = process.env.GOOGLE_URL;

app.post("/text_analysis", (req, res) => {
  //creating the API endpoint for text Recognition
  const { statement } = req.body;
  if (!statement) {
    res.status(418).send({ message: "We need a logo" }); //If client sends empty string
  } else {
    google
      .discoverAPI(DISCOVERY_URL)
      .then((client) => {
        const analyzeRequest = {
          // sending the JSON data of the input string from the client to the API endpoint of the publicc API
          comment: {
            text: `${statement}`,
          },
          requestedAttributes: {
            // requesting for custom parameters
            TOXICITY: {},
            INSULT: {},
            THREAT: {},
          },
        };

        client.comments.analyze(
          {
            key: API_KEY,
            resource: analyzeRequest,
          },
          (err, response) => {
            if (err) {
              res.send({
                // sends specific JSON data when unsupported language is inputed
                error: "error",
              });
              return;
            }

            // setting the variable with the corresponding probaility of toxicity , insult and threat respectively and sends JSON data response to client
            const tox =
              response.data.attributeScores.TOXICITY.summaryScore.value;
            const ins = response.data.attributeScores.INSULT.summaryScore.value;
            const trt = response.data.attributeScores.THREAT.summaryScore.value;

            res.send({
              //sending response to client with corresponding values
              TOXICITY: `${tox}`,
              INSULT: `${ins}`,
              THREAT: `${trt}`,
              error: "", // this will help us getting to know that there is now error , if error string is not empty then frontend will throw an error
            });
          }
        );
      })
      .catch((err) => {
        throw err;
      });
  }
});

app.use(cors());

app.post("/img_analysis", (req, res) => {
  //creating the API endpoint for Face Detection
  const { img_bs64 } = req.body;

  if (!img_bs64) {
    //if the base64 data is empty it will throw an error to the forntend
    res.status(418).send({ message: "We need a logo" });
  }

  //Imagga API Credentials
  const apiKey = process.env.IMEGGA_API_KEY;
  const apiSecret = process.env.IMEGGA_API_SECRET;

  const formData = new FormData();
  formData.append("image_base64", img_bs64); // foemdata is created with Client's input image's base64 data

  (async () => {
    try {
      const response = await got.post(
        "https://api.imagga.com/v2/faces/detections",
        { body: formData, username: apiKey, password: apiSecret }
      ); //POST request to the Imagga API endpoint of Face detection
      const data = JSON.parse(response.body);
      res.send({
        Faces: data.result.faces.length, // sends JSON data with number of faces
      });
    } catch (error) {
      console.log(error.response);
    }
  })();
});

app.listen(PORT, () => console.log(`its alive on http://localhost:${PORT}`)); // server is running on respective PORT
