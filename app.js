#!/usr/bin/env node

const Xray = require('x-ray');
const x = Xray();
const path =  require('path');
var read = require('fs').readFileSync;
var html = read(path.resolve(__dirname, 'index.html'));
const _ = require('underscore');

const nodemailer = require('nodemailer');
const mail_user = process.env.MAIL_USER || 'MY_USER';
const mail_pass = process.env.MAIL_PASS || 'MY_PASS';
const mail_recipient = 'genbx21@gmail.com';

const cineID = '116';
const url = 'https://m.cinemex.com/cartelera/'+cineID;

function scrape(url) {
  return new Promise((resolve, reject) => {
    x(html, '.mycinema-li', [{
      title: '.mycinema-item-title',
      link: '.mycinema-item-title@href',
      lang: ['.mycinema-variant'],
      //times: '.mycinema-sessions',
    }])((err, data) => {
        if(err) reject(err);
        let movies = data.filter((item) => {
          return item.lang.length > 1;
        });

        let mapped = movies.map(item => {
          mapLang = item.lang.map( l => {
            return delBreakLn(l);
          });

          let obj = {
            title: item.title,
            link: 'https://cinemex.com'+ item.link,
            lang: mapLang,
            times: item.times
          };
          return obj;
        });

        resolve(mapped);
    });
  });
}

function render(data){
  return new Promise((resolve, reject) => {
    var compile = _.template('<b>Pelicula:</b><a href= <%= link %>> <%= title %></a></p><p><b>Idioma: </b><%= lang %></p>');
    var html = '';
    for (var item in data){
      html += compile(data[item]);
    }
    resolve(html);
  });
}

function mail(data) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mail_user,
      pass: mail_pass
    }
  });

  var mailOptions = {
    from: 'youremail@gmail.com',
    to: mail_recipient,
    subject: 'Cinemex Guzman tiene una pelicula en ingles!',
    html: data
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}

function delBreakLn(str){
  str = str.slice(11);
  var match = /\r|\n/.exec(str);
  return str.substr(0,match.index);
}


scrape(url)
  .then(render)
  .catch(err => console.error(data))
    .then(mail)
    .catch(err => console.error(data));
