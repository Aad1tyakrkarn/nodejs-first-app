import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"backend",
}).then(()=>console.log("Database connected")).catch((e)=>console.log(e));

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
});

const User= mongoose.model("User",userSchema);

const app = express();

// const users=[];


//  app.use() is for using middleware. hee express.static() and express.urlencoded are the middlewares.
app.use(express.static(path.join(path.resolve(),"public")));          // app.use(exress.static) --> display the page on the root url
app.use(express.urlencoded({extended:true}));
app.use(cookieParser()); 

app.set("view engine","ejs");

const isAuthenticated = async (req,res,next)=>{
    const {token}=req.cookies;
    if(token){

        const decoded = jwt.verify(token,"secretdenahai");

        req.user = await User.findById(decoded._id);
        next();
    }
    else{
        res.redirect("login");  
    }

}


app.get("/",isAuthenticated,(req,res)=>{
      console.log(req.user)
    res.render("logout",{name:req.user.name})
});

app.get("/login",(req,res)=>{
    res.render("login")
  });
  

app.get("/register",(req,res)=>{
  res.render("register")
}); 

app.post("/login",async (req,res)=>{
    const {email,password} = req.body;

    let user = await User.findOne({email}); 
    if (!user) return res.redirect("/register");

    const isMatch = user.password===password;

    if(!isMatch) return res.render("login",{message: "incorrect password"});

    const token = jwt.sign({_id:user._id},"secretdenahai");
    res.cookie("token",token,{
        httpOnly:true, 
        expires:new Date(Date.now()+60*1000),                  // session expires from 60000ms(60 sec)
    });
    res.redirect("/");
})



 
app.post("/register",async (req,res)=>{

    const {name,email,password}= req.body;

    let user = await User.findOne({email})
    if(user){
        return res.redirect("/login");
    }
    user = await User.create({
        name,
        email,
        password,
    })

    const token = jwt.sign({_id:user._id},"secretdenahai");
    // console.log(token);

    res.cookie("token",token,{
        httpOnly:true, 
        expires:new Date(Date.now()+60*1000),                  // session expires from 60000ms(60 sec)
    });
    res.redirect("/");

    console.log(req.body)
});



app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now()),                  // session expires
    });
    res.redirect("/");
});



app.listen(5000,()=>{
    console.log("server is working");
})