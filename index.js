const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const app = express();
const collection = require("./mongo")
app.use(express.json());

const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,DELETE,PATCH',
  credentials: true,
};

app.use(cors(corsOptions));

const db = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://paridhiggupta:1234@cluster0.fuc8v3o.mongodb.net/?retryWrites=true&w=majority",
    //   {
    //     useNewUrlParser: true,
    //     useUnifiedTopology: true,
    //   }
    );
    console.log("DB is connected");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

db();

const prescriptionSchema = new mongoose.Schema({
    prescriptionText: {
      type: String,
      required: true,
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: true,
    },
  });
  

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  appointmentTime: {
    type: Date,
    required: true,
  },
  doctor: {
    type: String,
    enum: ['Mr Khan', 'Mrs Prerna', 'Mr Singh', 'Mr Sharma'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  prescription: prescriptionSchema, // Embed the prescription schema
}, {
  timestamps: true,
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);
app.post("/login",async(req,res)=>{
  const{email,password}=req.body

  try{
      const check=await collection.findOne({email: email, password: password})

      if(check){
          res.json("exist")
      }
      else{
          res.json("notexist")
      }

  }
  catch(e){
      res.json("fail")
  }

})



app.post("/signup", async (req, res) => {
  const { name, email, password, age, phoneNumber, bloodGroup } = req.body;

  const data = {
    name: name,
    email: email,
    password: password,
    age: age,
    phoneNumber: phoneNumber,
    bloodGroup: bloodGroup,
  };

  try {
    const check = await collection.findOne({ email: email, password: password});

    if (check) {
      res.json("exist");
    } else {
      res.json("notexist");
      await collection.insertMany([data]);
    }
  } catch (e) {
    res.json("fail");
  }
});
// CRUD operations for Feedback model
app.post('/feedback', function (req, res) {
  const feedbackData = req.body;

  const feedback = new Feedback(feedbackData);

  feedback.save()
    .then((savedFeedback) => {
      res.status(201).json(savedFeedback);
    })
    .catch((error) => {
      console.error('Error inserting data to MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while saving the data.' });
    });
});

app.get('/feedback', function (req, res) {
  Feedback.find({})
    .then((feedbacks) => {
      res.status(200).json(feedbacks);
    })
    .catch((error) => {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while fetching the data.' });
    });
});

app.get('/feedback/:id', function (req, res) {
  const feedbackId = req.params.id;

  Feedback.findById(feedbackId)
    .then((feedback) => {
      if (feedback) {
        res.status(200).json(feedback);
      } else {
        res.status(404).json({ error: 'Feedback not found.' });
      }
    })
    .catch((error) => {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while fetching the data.' });
    });
});

app.put('/feedback/:id', function (req, res) {
  const feedbackId = req.params.id;
  const updatedFeedbackData = req.body;

  Feedback.findByIdAndUpdate(feedbackId, updatedFeedbackData, { new: true })
    .then((updatedFeedback) => {
      if (updatedFeedback) {
        res.status(200).json(updatedFeedback);
      } else {
        res.status(404).json({ error: 'Feedback not found.' });
      }
    })
    .catch((error) => {
      console.error('Error updating data in MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while updating the data.' });
    });
});

app.delete('/feedback/:id', function (req, res) {
  const feedbackId = req.params.id;

  Feedback.findByIdAndDelete(feedbackId)
    .then((deletedFeedback) => {
      if (deletedFeedback) {
        res.status(200).json({ message: 'Feedback deleted successfully.' });
      } else {
        res.status(404).json({ error: 'Feedback not found.' });
      }
    })
    .catch((error) => {
      console.error('Error deleting data in MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while deleting the data.' });
    });
});

// ... (previous code)

// CRUD operations for Prescription model
app.post('/prescription', async function (req, res) {
    try {
      const prescriptionData = req.body;
      const feedbackId = prescriptionData.feedbackId;
  
      // Check if the feedbackId is provided
      if (!feedbackId) {
        return res.status(400).json({ error: 'Feedback ID is required.' });
      }
  
      // Check if the feedback with the provided ID exists
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }
  
      // Create the prescription and associate it with the feedback document
      const prescription = new Prescription({
        prescriptionText: prescriptionData.prescriptionText,
        feedback: feedback._id,
      });
  
      // Save the prescription to the database
      await prescription.save();
  
      // Populate the prescription with the complete feedback document
      const populatedPrescription = await Prescription.findById(prescription._id)
        .populate({
          path: 'feedback',
          model: 'Feedback',
        })
        .exec();
  
      res.status(201).json(populatedPrescription);
    } catch (error) {
      console.error('Error inserting prescription to MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while saving the prescription.' });
    }
  });
  
  
  app.get('/prescription', async function (req, res) {
    try {
      const prescriptions = await Prescription.find({})
        .populate({
          path: 'feedback',
          model: 'Feedback',
        })
        .exec();
  
      res.status(200).json(prescriptions);
    } catch (error) {
      console.error('Error fetching prescription from MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while fetching the prescription.' });
    }
  });
  
  app.get('/prescription/:id', async function (req, res) {
    try {
      const prescriptionId = req.params.id;
  
      const prescription = await Prescription.findById(prescriptionId)
        .populate({
          path: 'feedback',
          model: 'Feedback',
        })
        .exec();
  
      if (prescription) {
        res.status(200).json(prescription);
      } else {
        res.status(404).json({ error: 'Prescription not found.' });
      }
    } catch (error) {
      console.error('Error fetching prescription from MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while fetching the prescription.' });
    }
  });
  
  app.put('/prescription/:id', async function (req, res) {
    try {
      const prescriptionId = req.params.id;
      const updatedPrescriptionData = req.body;
  
      const updatedPrescription = await Prescription.findByIdAndUpdate(prescriptionId, updatedPrescriptionData, { new: true })
        .populate({
          path: 'feedback',
          model: 'Feedback',
        })
        .exec();
  
      if (updatedPrescription) {
        res.status(200).json(updatedPrescription);
      } else {
        res.status(404).json({ error: 'Prescription not found.' });
      }
    } catch (error) {
      console.error('Error updating prescription in MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while updating the prescription.' });
    }
  });
  
  app.delete('/prescription/:id', async function (req, res) {
    try {
      const prescriptionId = req.params.id;
  
      const deletedPrescription = await Prescription.findByIdAndDelete(prescriptionId)
        .populate({
          path: 'feedback',
          model: 'Feedback',
        })
        .exec();
  
      if (deletedPrescription) {
        res.status(200).json({ message: 'Prescription deleted successfully.' });
      } else {
        res.status(404).json({ error: 'Prescription not found.' });
      }
    } catch (error) {
      console.error('Error deleting prescription in MongoDB:', error);
      res.status(500).json({ error: 'An error occurred while deleting the prescription.' });
    }
  });
  
  // ... (remaining code)
  

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
