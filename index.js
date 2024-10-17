const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_DB);

const UserSchema = new Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Excercise", ExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req,res) => {
  try {
    const userList = await User.find();
    res.json(userList)
  } catch (err) {
    res.json({message: err})
  }
})

app.post("/api/users", async (req,res) => {
  const userObj = new User({username: req.body.username})
  try {
    const user = await userObj.save();
    res.json(user)    
  } catch (err) {
    res.json({message: err})
  }
  
})

app.post("/api/users/:_id/exercises", async (req,res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(id);
    if(!user) throw new Error('Could not find user');
    
    const exerciseObj = new Exercise({
      date: date ? new Date(`${date}T00:00:00`) : new Date(), 
      description,duration,
      user_id: user._id
    });

    const excercise = await exerciseObj.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: new Date(excercise.date).toDateString(),
      duration: excercise.duration,
      description: excercise.description,
    });
  } catch (err) {
    res.json({message: err})    
  }
})

app.get("/api/users/:_id/logs", async (req,res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(id);
    if(!user) throw new Error('Could not find user');

    let dateObj = {};

    if(from){
      dateObj['$gte'] = new Date(from);
    }

    if(to){
      dateObj['$lte'] = new Date(to);
    }
    let filter = {
      user_id: id
    };

    if(from || to){
      filter.date = dateObj;
    }

    
    const excercises = await Exercise.find(filter).limit(+limit ?? 500);
    const excercisesLog = [];
    excercises.forEach(ex => {
      const excerciseObj = {
        description: ex.description,
        duration: ex.duration,
        date: new Date(ex.date).toDateString()
      };
      excercisesLog.push(excerciseObj);
    });
    res.json({
      _id: user._id,
      username: user.username,
      count: excercises.length,
      log: excercisesLog 
      
    });
  } catch (err) {
    res.json({message: err})    
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
