const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose')
const fs = require('fs')
const path =require('path')
const multer = require('multer');
const app = express();
const methodOverride = require('method-override')
var Blog = require('./models/blog.js');
const { result } = require('lodash');
const { send, redirect, render } = require('express/lib/response');
const { response } = require('express');

const DBURI = 'mongodb+srv://Maged:123456maged@cluster0.ct8zs.mongodb.net/BlogProject?retryWrites=true&w=majority';
mongoose.connect(DBURI, { useNewUrlParser: true, useUnifiedTopology: true})
.then((result)=>{console.log('connected to db')})
.catch((err)=>{console.log(err)});

const storage = multer.diskStorage({
    destination:function(request, file, cb){
        cb(null, './public/uploads')
    },
    filename:function(request, file, cb){
        cb(null,Date.now()+file.originalname)
    },
});
const upload = multer({
    storage:storage,
    limits:{
        fileSize:1024*1024*3
    }
})

app.set('view engine','ejs');
app.use(methodOverride('_method'));

app.listen(3000);

app.use(morgan('div'));
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

app.get('/',(req, res)=>{
res.redirect('/blogs');
});

app.post('/blogs',upload.single('image'),(req,res)=>{
const blog = new Blog({
    title:req.body.title,
    body:req.body.body,
    image:req.file.filename
});
if(req.body.image){
    if(blog.image != null){
       blog.image =  req.file.filename; 
    }else{
        
    }
}
    blog.save().then((result)=>{
        res.redirect('/blogs');
    }).catch((err)=>{
        console.log(err);
    });
});
app.get('/blogs/:page', function(req, res, next) {
    var perPage = 2
    var page = req.params.page || 1

    Blog
        .find({})
        .sort({createdAt: -1})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, blogs) {
            Blog.count().exec(function(err, count) {
                if (err) return next(err)
                res.render('index.ejs', {
                    blogs: blogs,
                    current: page,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
})
app.get('/blogs',async (req,res)=>{
    res.redirect('blogs/1');
});
app.get('/blogs/:id',(req,res)=>{
    const id = req.params.id;
    Blog.findById(id).then((result)=>{
        res.render('details',{blog:result})
    }).catch((err)=>{
        console.log(err)
    })
});
app.get('/test',async (req,res)=>{
    const blogId = '62162d04bb6983bfdfd3e050';
    let blog=await Blog.findById(blogId).exec();
    console.log(blog);
});
app.delete('/blogs/:id',async (req,res)=>{
    const blogId = req.params.id;
    const blog=await Blog.findById(blogId).exec();
    console.log(blog);
    oldImage = blog.image;
    console.log(oldImage);
    if (oldImage) {
        const oldPath = path.join(__dirname,"public/uploads", oldImage);
        console.log(oldPath);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });
        }
    }
    Blog.findByIdAndDelete(blogId)
    .then((result)=>{
        res.json({redirect:'/blogs'});
    }).catch((err)=>{
        console.log(err);
    })
})
app.get('/blogs/edit/:id',(req,res)=>{
    const id = req.params.id;
    Blog.findById(id).then((result)=>{
        res.render('edit',{blog:result})
    }).catch((err)=>{
        console.log(err)
    })
})
app.put('/blogs/update/:id',upload.single('image'), async (req,res)=>{
    req.blog =await Blog.findById(req.params.id);
    let blog = req.blog;
    blog.title = req.body.title;
    blog.body = req.body.body;
    blog.image = req.file.filename;
    if (!req.file){
        console.log("nooo");
    }
    try {
        blog = await blog.save();
        res.redirect(`/blogs/${blog.id}`);
    } catch (error) {
        console.log(error);
    }
})
app.get('/about',(req, res)=>{
res.render('about')
});
app.get('/new',(req, res)=>{
res.render('createABlog');
});
app.get('/*',(req, res)=>{
    res.render('404');
    });