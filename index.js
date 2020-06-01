const express = require('express');
const app = express();
const ytdl = require('ytdl-core');
const youtubedl   = require('youtube-dl');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const proc = new ffmpeg();
const getDownloadUrl = require('facebook-video-downloader');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Certificate
/*const privateKey = fs.readFileSync('/etc/letsencrypt/live/www.saveplusx2.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/www.saveplusx2.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/www.saveplusx2.com/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};*/

/*const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);*/


app.listen(80);


/*httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});*/



var ytbUrl = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
var faceUrl = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:facebook\.com|facebook.com))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
var twitterUrl = /^((?:https?:)?\/\/)?((?:www|m|mobile)\.)?((?:twitter\.com))(\/(?:[\w\-]+\/status\/)?)([\w\-]+)(\S+)?$/;

// CẤU HÌNH EJS
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/help/about", function(req,res) {
    res.render("help");
})

app.get("/help/website", function(req,res) {
    res.render("help");
})

app.get("/:id", function(req, res){
    var url = req.params.id,
    url = url.replace(".https...","https://");
    url = url.replace(".http...","https://");
    url = url.replace(/[$]/g,"?v=");
    url = url.replace(".watch","/watch");
    if(url.split(".")[1] == "youtube" || url.split(".")[0] == "https://youtu") { //GET LINK YOUTUBE
        try {
            if(url.split(".")[1] == "youtube") {
                ytdl.getInfo(url, function callback(err, info) {
                    if (err) {
			console.log(err);
                      res.send('{"errorcode" : "404"}');
                    }
                    if (info) {
                      video1 = info.formats[0].url // 360p WITH AUDIO
                      video2 = info.formats[2].url // 1080p
                      video3 = info.formats[4].url // 720p
                      video4 = info.formats[6].url // 480p
                      video5 = info.formats[8].url // 360p
                      video6 = info.formats[10].url // 240p
                      video7 = info.formats[12].url // 144p
                      video8 = info.formats[14].url // 128 audio
        
                      res.render("download", {type: 0, videoTitle: info.player_response.videoDetails.title, videoThumbnail: info.player_response.videoDetails.thumbnail, video1: video1, video2: video2, video3: video3, video4: video4, video5: video5, video6: video6, video7: video7, video8: video8})
                    }
                  })
            }else {
                url = "https://www.youtube.com/watch?v=" + url.split(".")[2];
                ytdl.getInfo(url, function callback(err, info) {
                    if (err) {
                      res.send('{"errorcode" : "404"}');
                    }
                    if (info) {
                      video1 = info.formats[0].url // 360p WITH AUDIO
                      video2 = info.formats[2].url // 1080p
                      video3 = info.formats[4].url // 720p
                      video4 = info.formats[6].url // 480p
                      video5 = info.formats[8].url // 360p
                      video6 = info.formats[10].url // 240p
                      video7 = info.formats[12].url // 144p
                      video8 = info.formats[14].url // 128 audio
        
                      res.render("download", {type: 0, videoTitle: info.player_response.videoDetails.title, videoThumbnail: info.player_response.videoDetails.thumbnail, video1: video1, video2: video2, video3: video3, video4: video4, video5: video5, video6: video6, video7: video7, video8: video8})
                    }
                  })
            }
        }catch(e) {
            res.render("error",{error:e});
        }
    }else if(url.split(".")[1] == "facebook") { //GET LINK FACEBOOK
        url = url.replace("https://","");
        url = url.replace("http://","");
        url = url.replace("www.","");
        url = url.replace("facebook.com","");
        let iduser = url.slice(0, url.indexOf(".videos"));
        url = url.replace(iduser,"");
        url = url.replace(/\./g, "/");
        url = iduser+url;
        url = url.slice(1,-1);
        url = 'https://www.facebook.com/' + url + "/";
        console.log(url);
        getDownloadUrl(url)
        .then(function(data){
            res.render("download", {type: 1, video1: data.hd, video2: data.sd});
        })
        .catch(function(e) {
            console.log(e);
        });
    }else if(url.split(".")[1] == "tiktok") { //GET LINK TIKTOK
        try {
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("tiktok.com","");
            url = url.replace(".video.", "/video/");
            url = url.split("@");
            url[0] = url[0].replace(/\./g, "/")
            url = url.join("@");
            
            tiktokGetLink(url, function(data) {
                res.render("download", {type: 2, video1: data[0], thumbnail: data[1], title: data[2]});
            })
        }catch(e) { 
            res.render("error", {error: e});
        }
    }else if(url.split(".")[1] == "instagram") { // GET LINK INSTAGRAM
        try {
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("instagram.com","");
            url = url.replace(/\./g, "/");
            
            instagramGetLink(url, function(data) {
                res.render("download", {type: 3, video1: data[0], thumbnail: data[1], title: data[2]});
            });
        }catch(e) {
            res.render("error", {error:e});
        }
    }else if(url.split(".")[0] == "https://twitter" || url.split(".")[1] == "twitter"){ // GET LINK TWITTER
        try {
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("twitter.com","");
            url = url.replace(/\./g, "/");
            url = "https://twitter.com" + url;
    
            twitterGetLink(url, function(data){
                res.render("download", {type: 4, video1: data[0], video2: data[1], video3: data[2],  thumbnail: data[3], title: data[4]});
            });
        }catch(e) {
            res.render("error",{error:e});
        }
    }else if(url.split(".")[1] == "reddit") { //REDDIT GET LINK
        try {
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("reddit.com","");
            url = url.replace(/\./g, "/");
            url = "https://reddit.com" + url.slice(0, -1) + ".json";
    
            redditGetLink(url, function(data) {
                res.render("download", {type: 5, video1:data[0], video2: data[4], thumbnail: data[1], title: data[2], audio: data[3], videoQuality: data[5]});
            });
        }catch(e) {
            res.render("error",{error:e});
        }
    }else if(url.split(".")[1] == "tumblr"){
        try {
            let userId = "";
            userId = url.slice(0, url.indexOf(".tumblr.com"));
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace(url.slice(0,url.indexOf(".tumblr.com")),"");
            url = url.replace(".tumblr.com","");
            url = url.replace(/\./g, "/");
            
    
            tumblrGetLink(url, userId, function(data){
                res.render("download", {type: 6, video1: data[0], thumbnail: data[1], title: data[2]});
            });
        }catch(e) {
            res.render("error", {error:e});
        }
    }else if(url.split(".")[0] == "https://vimeo" || url.split(".")[1] == "vimeo") { //VIMEO GET LINK
        try {
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("vimeo.com","");
            url = url.replace(/\./g, "/");
            url = "https://vimeo.com" + url;  
    
            vimeoGetLink(url, function(data) {
                res.render("download", {type: 7, video1: data[0], video2: data[1], video3: data[2], video4:data[3], thumbnail: data[4], title: data[5]});
            });
        }catch(e) {
            res.render("error", {error: e})
        }
    }else if(url.split(".")[0] == "https://vk" || url.split(".")[1] == "vk") { //WK GET LINK
        try{
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("vk.com","");
            url = url.replace(/\./g, "/");
            url = "https://vk.com" + url; 
            wkGetLink(url, function(data) {
                res.render("download", {type: 8, video1: data[0], video2: data[1], video3: data[2],video4: data[3], video5: data[4], thumbnail: data[5], title: data[6]});
            });
        }catch(e) {
            res.render("error", {error: e})
        }
    }else if(url.split(".")[1] == "twitch") {
        try{
            url = url.replace("https://","");
            url = url.replace("http://","");
            url = url.replace("www.","");
            url = url.replace("twitch.tv","");
            url = url.replace(/\./g, "/");
            url = "https://twitch.tv" + url; 
            twitchGetLink(url, function(data) {
                res.render("download", {type: 9, video1: data[0], video2: data[1], video3: data[2],video4: data[3], thumbnail: data[4], title: data[5]});
            });
        }catch(e) {
            res.render("error", {error: e})
        }
    }else {
        res.render("error", {error: "ERROR! Invalid URL or video is private!"})
    }
});

// utility function to convert bytes to human readable.
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
 };

//TWITCH GET LINK
function twitchGetLink(url, callback) {
    youtubedl.getInfo(url, function(err, info){
        if (err) {
            console.log(err);
        }
        let video1 = info.formats[3].url;
        let video2 = info.formats[2].url;
        let video3 = info.formats[1].url;
        let video4 = info.formats[0].url;
        let thumbnail = info.thumbnail;
        let title = info.title;
        let videoData = [video1, video2, video3, video4, thumbnail, title];
        return callback(videoData);
    })
}

//COMBINE VIDEO AND SOUNDS
function combine(videoUrl, soundUrl, videoId, callback) {
    console.log(videoId + "  " + videoUrl);
   proc.addInput(videoUrl)
     .output(`./public/files/${videoId}.mp4`)
     .on("error", err => {
       console.log("Error: " + err);
     })
     .on("end", () => { 
        return callback("done");
     });
 
 fetch(soundUrl)
    .then(resp => {
      if (resp.status === 200) {
        console.log('Founded audio track...')
        proc.addInput(soundUrl);
      } else {
        console.log('No audio track...');
      }
      console.log('Downloading and converting...');
      proc.run();
    });
}

//WK GET LINK
function wkGetLink(url, callback) {
    youtubedl.getInfo(url, function(err, info) {
        if (err) {
            console.log(err);
          }
        let video1 = info.formats[0].url; //240p
        let video2 = info.formats[2].url; //360p
        let video3 = info.formats[4].url; //480p
        let video4 = info.formats[6].url; //720p
        let video5 = info.formats[8].url; //1080p
        let thumbnail = info.thumbnail; // thumbnail
        let title = info.title;
        let videoData = [video1, video2, video3, video4, video5, thumbnail, title];

        return callback(videoData);
    });
}

//FILTER LINK TRONG VIMEO
function isMp4(ar) {
    return ar.ext === "mp4" && ar.height === 1080 && ar.url.endsWith(".mp4") || ar.ext === "mp4" && ar.width === 1366 && ar.url.endsWith(".mp4") || ar.ext === "mp4" && ar.width === 1280 && ar.url.endsWith(".mp4") || ar.ext === "mp4" && ar.width === 960 && ar.url.endsWith(".mp4") || ar.ext === "mp4" && ar.width === 640 && ar.url.endsWith(".mp4") || ar.ext === "mp4" && ar.width === 426 && ar.url.endsWith(".mp4");
}

//VIMEO GET LINK FUNCTION
function vimeoGetLink(url, callback) {
    youtubedl.getInfo(url, function(err, info) {
        if (err) {
          stream.emit('error', err);
          return stream;
        }
    
        let thumbnail = info.thumbnails[3].url;
        let title = info.title;
        let video = [];
        for(var i = 0; i < info.formats.length; i++) {
            if(isMp4(info.formats[i])) {
                video.push(info.formats[i].url);
            };
        }
        video = video.reverse();
        let videoData = [video[0], video[1], video[2], video[3], thumbnail, title];
        return callback(callback(videoData));
    });
}

//TUMBLR GET LINK FUNCTION
async function tumblrGetLink(url, userId, callback) {
    try {
        const browser = await puppeteer.launch({ headless: false, args:['--no-sandbox'] });
        const tumblr = await browser.newPage(); 
        await tumblr.waitFor(1000);
        await tumblr.goto(userId + ".tumblr.com" + url);

        let tumblrdata = await tumblr.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
            let videoURL = document.querySelector("source").src;
            let thumbnail = document.querySelector('video').poster;
            let title = document.querySelector(".caption > p").innerText;
            var videoData = [videoURL, thumbnail, title];
            return videoData;
        });

        return callback(tumblrdata);
        await browser.close();
    }catch(error) {
            console.log(error);
    }
}

//REDDIT VIDEO GETLINK FUNCTION
function redditGetLink(url, callback) {
    let settings = { method: "Get" };

    fetch(url, settings)
    .then(res => res.json())
    .then((json) => {
        let video1 = json[0].data.children[0].data.secure_media.reddit_video.fallback_url; //video no sounds
        let videoQuality = json[0].data.children[0].data.secure_media.reddit_video.height; 
        let thumbnail = json[0].data.children[0].data.thumbnail;
        let title = json[0].data.children[0].data.title;
        let audio = video1.slice(0, video1.lastIndexOf("DASH")) + "audio";
        let videoId = json[0].data.children[0].data.id;
        var videoData = [video1, thumbnail, title, audio, videoId, videoQuality];

        combine(video1, audio, videoId, function(done){
            if(done == "done"){              
                return callback(videoData);
            }
        });
    });
}

//TWITTER GET LINK FUNCTION
async function twitterGetLink(url, callback) {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const twitter = await browser.newPage();
        await twitter.goto("http://twittervideodownloader.com/");

        await twitter.type('.input-group-field', url);
        await twitter.keyboard.press('Enter');
      
        await twitter.waitForNavigation();

        let twitterdata = await twitter.evaluate(() => {
            let videoURL1 = document.querySelectorAll("a")[4].href;
            let videoURL2 = document.querySelectorAll("a")[5].href;
            let videoURL3 = document.querySelectorAll("a")[6].href;
            let thumbnail = document.querySelectorAll('img')[0].src;
            let title = document.querySelectorAll('b')[2].innerText;
            var videoData = [videoURL1, videoURL2, videoURL3, thumbnail, title];
            return videoData;
        });

        return callback(twitterdata);
        await browser.close();
    }catch(error) {
            console.log(error);
    }
}

//TIKTOK GET LINK FUNCTION
async function tiktokGetLink(url, callback) {
    try {
        const browser = await puppeteer.launch({ headless: true , args:['--no-sandbox']});
        const tiktok = await browser.newPage();
        await tiktok.goto("https://www.tiktok.com" + url);

        let tiktokdata = await tiktok.evaluate(() => {
            let videoURL = document.querySelectorAll('video')[0].src;
            let thumbnail = document.querySelectorAll('.video-card-big.jsx-1038045583 .video-card-container.jsx-1038045583 > div')[0].style .backgroundImage;
            thumbnail = thumbnail.replace('url("','');
            thumbnail = thumbnail.replace('")','');
            let title = document.querySelectorAll('.video-card-big.jsx-1038045583 .content-container.jsx-1038045583 .video-meta-info.jsx-1038045583 .video-meta-title.jsx-1038045583 > strong')[0].innerText;
            var videoData = [videoURL, thumbnail, title];
            return videoData;
        });

        return callback(tiktokdata);
        await browser.close();
    }catch(error) {
            console.log(error);
    }
}

//INSTAGRAM GET LINK FUNCTION
async function instagramGetLink(url, callback) {
    try {
        const browser = await puppeteer.launch({ headless: true, args:['--no-sandbox'] });
        const instagram = await browser.newPage();
        await instagram.goto("https://www.instagram.com" + url);

        let instagramdata = await instagram.evaluate(() => {
            let videoURL = document.querySelectorAll('video')[0].src;
            let thumbnail = document.querySelectorAll('._8jZFn')[0].src;
            let title = document.querySelectorAll('.C4VMK > span')[0].innerText;
            var videoData = [videoURL, thumbnail, title];
            return videoData;
        });

        return callback(instagramdata);
        await browser.close();
    }catch(error) {
            console.log(error);
    }
}