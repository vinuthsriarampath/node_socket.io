export const fileUpload =  async (req,res,next) => {
    try{
        console.log("hitting to /upload controller")
        const fileUrl = `/uploads/chat/${req.file.filename}`;
        res.json( { success:true, fileUrl } );
    }catch (e) {
        return next(e);
    }
}