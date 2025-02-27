import mongoose from 'mongoose';
import config from './app/config';
import app from './app';

async function main() {
  try {
    console.log("connecting to mongodb....⏳");
    await mongoose.connect(config.db_url as string);
    console.log("Database connected successfully... ✅");

    app.listen(config.port, () => {
      console.log(`ZyroMart E-commerce management server app listening on port : ${config.port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
