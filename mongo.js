const mongoose=require("mongoose")
// mongoose.connect("mongodb+srv://paridhiggupta:1234@cluster0.ca4cbhp.mongodb.net/login1")
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log('failed');
// })


const newSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
  });
  
  const collection = mongoose.model("collection", newSchema);
  
  module.exports = collection;