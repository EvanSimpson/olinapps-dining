var express = require('express');
var rem = require('rem');
var skim = require('skim');

var daynames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

var meals = [];
rem.stream('http://olindining.com/CampusCenterDiningWeek1_005.htm').get().pipe(skim({
  'breakfast': {
    $query: '.brk',
    $each: '(text)'
  },
  'lunch': {
    $query: '.lun',
    $each: '(text)'
  },
  'dinner': {
    $query: '.din',
    $each: '(text)'
  }
}, function (res) {
  try {
    function parse (datums) {
      var brk = [];
      var day = {};
      var cur = [];
      datums.forEach(function (b) {
        b = b.substr(1);
        if (b == 'REAKFAST' || b == 'UNCH' || b == 'INNER') {
          day = {};
          brk.push(day);
        } else {
          // console.log(JSON.stringify(b));
          if (!b.match(/^[\r\n]/)) {
            cur = [];
            day[String(b.match(/^[^\r]+/)[0])] = cur;
            b = b.replace(/^[^\r]+/, '');
          }
          cur.push(String(b.replace(/^\s+|\s+$/g, '')));
        }
      });
      return brk;
    }

    // console.log(meals);

    var breakfast = parse(res.breakfast);
    var lunch = parse(res.lunch);
    var dinner = parse(res.dinner);

    for (var i = 0; i < breakfast.length; i++) {
      meals.push({
        dayname: daynames[i],
        breakfast: breakfast[i],
        lunch: lunch[i],
        dinner: dinner[i]
      });
    }
  } catch (e) {
    console.log('ERROR:', e);
  }

  console.log(JSON.stringify(meals));
}))

var app = express();

app.get('/', function (req, res) {
  res.redirect('/api');
})

app.get('/api', function (req, res) {
  res.json(meals);
})

app.listen(process.env.PORT || 3000);