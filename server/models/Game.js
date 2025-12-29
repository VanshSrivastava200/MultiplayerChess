import mongoose from "mongoose";
const gameSchema = new mongoose.Schema({
    username1:{
        type:String,
        color:String,
        required:true,
        trim:true
    },
    username2:{
        type:String,
        color:String,
        required:true,
        trim:true
    },
    status:{
        type:Number,
        required:true,
    },
},{timestamps:true})

const Game=mongoose.model('Game',gameSchema);
export default Game;