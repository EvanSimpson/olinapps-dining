var express = require('express');
var rem = require('rem');
var scrapi = require('scrapi');

var all = {};
rem.stream('http://olindining.com/CampusCenterDiningWeek1_005.htm').get().pipe(scrapi.parser({
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
          day = [];
          brk.push(day);
        } else {
          // console.log(JSON.stringify(b));
          if (!b.match(/^[\r\n]/)) {
            cur = [];
            day[b.match(/^[^\r]+/)[0]] = cur;
            b = b.replace(/^[^\r]+/, '');
          }
          cur.push(b.replace(/^\s+|\s+$/g, ''));
        }
      });
      return brk;
    }

    console.log(all);

    all = {
      breakfast: parse(res.breakfast),
      lunch: parse(res.lunch),
      dinner: parse(res.dinner),
    };
  } catch (e) {
    console.log(e);
  }
}))

var app = express();

app.get('/', function (req, res) {
  res.json(all);
})

app.listen(process.env.PORT || 3000);