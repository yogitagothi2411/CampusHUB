require('dotenv').config();
const express=require('express'); const cors=require('cors');
const app=express(); app.use(cors()); app.use(express.json({limit:'1mb'}));
app.use((req,res,next)=>{req.requestId=req.headers['x-request-id']||require('crypto').randomUUID();res.setHeader('X-Request-ID',req.requestId);next();});
app.get('/health',(req,res)=>res.json({success:true,service:process.env.SERVICE_NAME||'service',status:'ok'}));

app.use(require('./routes'));
app.use((req,res)=>res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Route not found',details:null},request_id:req.requestId}));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({success:false,error:{code:'INTERNAL_ERROR',message:'Internal server error',details:null},request_id:req.requestId});});
const PORT=Number(process.env.PORT||3004); app.listen(PORT,()=>console.log(`${process.env.SERVICE_NAME||'service'} listening on ${PORT}`));
