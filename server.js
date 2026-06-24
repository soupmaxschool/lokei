const express = require("express");
const { createServer } = require("rammerhead");

const app = express();
const rh = createServer();

app.use(rh.app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rammerhead running on " + PORT));
