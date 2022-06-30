const multer = require("multer");
const Path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = "uploads";
    console.log("fieldname ", file.fieldname);
    if (file.fieldname == "userPic") {
      dir = "uploads/user/profile_pic";
    } else if (file.fieldname == "shopLogo") {
      dir = "uploads/shop/logo";
    }

    try {
      fs.exists(dir, (exist) => {
        if (!exist) {
          return fs.mkdir(dir, { recursive: true }, (error) => cb(error, dir));
        }
        return cb(null, dir);
      });
    } catch (e) {
      console.log("An error occurred.", e);
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "--" + file.originalname);
  },
});

const fileFilter = (req, file, callback) => {
  const acceptableExtensions = [".png", ".jpg", ".mp4"];
  if (!acceptableExtensions.includes(Path.extname(file.originalname))) {
    return callback(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }

  const fileSize = parseInt(req.headers["content-length"]);
  if (fileSize > 1048576) {
    return callback(new Error("File Size Big"));
  }

  callback(null, true);
};

let uploadShopLogo = multer({
  storage: storage,
  fileFilter: fileFilter,
  fileSize: 1048576, // 10 Mb
});
let uploadUserPic = multer({
  storage: storage,
  fileFilter: fileFilter,
  fileSize: 1048576, // 10 Mb
});
let uploadReview = multer({
  storage: storage,
  fileFilter: fileFilter,
  fileSize: 1048576, // 10 Mb
});

module.exports = {
  uploadShopLogo: uploadShopLogo.single("shopLogo"),
  uploadUserPic: uploadUserPic.single("userPic"),
  uploadReviewPic: uploadReview.single("reviewPic"),
};
