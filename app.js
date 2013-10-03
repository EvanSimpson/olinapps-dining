var express = require('express');
var rem = require('rem');
var skim = require('skim');

var daynames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

var meals = [];
var nutrition = {};
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
  },
  'scripts': {
    $query: 'script',
    $each: '(text)'
  }
}, function (res) {
  if (!res.scripts[1]) {
    console.error('No data :(');
    return;
  }

  var nut_keys = ['serv_size',
  'calories', 'fat_calories',
  'fat', 'percent_fat_dv',
  'satfat', 'percent_satfat',
  'trans_fat',
  'cholesterol', 'percent_cholesterol',
  'sodium', 'percent_sodium',
  'carbo', 'percent_carbo',
  'dfib', 'percent_dfib',
  'sugars', 'protein',
  'a', 'cp', 'up', 'ip',
  'name', 'description', 'allergen',
  'percent_vit_a_dv',
  'percent_vit_c_dv',
  'percent_calcium_dv',
  'percent_iron_dv',
  '_'];

  var nutrition_bad = eval(res.scripts[3].replace('<!--', '//') + '; aData');
  nutrition = {};
  Object.keys(nutrition_bad).forEach(function (key) {
    var a = nutrition[nutrition_bad[key][22]] = {};
    nutrition_bad[key].forEach(function (val, i) {
      a[nut_keys[i]] = val;
    })
  })

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
          if (!b.match(/^[\r\n]/)) {
            cur = [];
            day[String(b.match(/^[^\r]+/)[0])] = cur;
            b = b.replace(/^[^\r]+/, '');
          }

          var name = String(b.replace(/^\s+|\s+$/g, ''));
          cur.push({
            name: name,
            nutrition: 'http://olinapps-dining.heroku.com/api/nutrition/' + encodeURIComponent(name)
          });
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

  // console.log(JSON.stringify(meals));
}))

var app = express();

app.get('/', function (req, res) {
  res.redirect('/api');
})

app.get('/api', function (req, res) {
  res.json(meals);
})

app.get('/api/nutrition', function (req, res) {
  res.json(nutrition);
})

app.get('/api/nutrition/:id', function (req, res) {
  res.json(nutrition[req.params.id]);
})

app.listen(process.env.PORT || 3000);