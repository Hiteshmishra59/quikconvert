/* ============================================================
   QuikConvert — script.js
   Handles: Navbar, Calculator, Unit Converter,
            Currency, Age Calculator, QR Generator, SIP Calculator
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   NAVBAR — active link + mobile menu
────────────────────────────────────────────── */
(function initNavbar() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function (link) {
    if (link.getAttribute('href') === page ||
        (page === '' && link.getAttribute('href') === 'index.html')) {
      link.classList.add('active');
    }
  });

  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      navMenu.classList.toggle('open');
      hamburger.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
    });
  }
})();

/* ──────────────────────────────────────────────
   FULL CALCULATOR
────────────────────────────────────────────── */
(function initFullCalculator() {
  var display  = document.getElementById('calc-display');
  var exprLine = document.getElementById('calc-expr');
  if (!display) return;

  var current    = '0';
  var expression = '';
  var newInput   = true;

  function render() {
    display.textContent = current;
    if (exprLine) exprLine.textContent = expression;
    display.classList.toggle('error-state', current === 'Error');
  }

  function handle(val) {
    if (val === 'C') {
      current = '0'; expression = ''; newInput = true;
      render(); return;
    }
    if (val === '⌫') {
      current = current.length <= 1 ? '0' : current.slice(0, -1);
      if (current === '') { current = '0'; newInput = true; }
      render(); return;
    }
    if (val === 'x²') { current = String(parseFloat(current) ** 2); render(); return; }
    if (val === '√')  {
      var n = parseFloat(current);
      current = n < 0 ? 'Error' : String(Math.sqrt(n));
      render(); return;
    }
    if (val === '%')  { current = String(parseFloat(current) / 100); render(); return; }

    if (['÷','×','−','+'].includes(val)) {
      expression = current + ' ' + val + ' ';
      newInput = true; render(); return;
    }

    if (val === '=') {
      try {
        var raw = (expression + current)
          .replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');
        /* eslint-disable-next-line no-new-func */
        var result = Function('"use strict";return(' + raw + ')')();
        current = isFinite(result) ? String(parseFloat(result.toPrecision(12))) : 'Error';
      } catch (_) { current = 'Error'; }
      expression = ''; newInput = true; render(); return;
    }

    // digits & decimal
    if (newInput) {
      current  = val === '.' ? '0.' : val;
      newInput = false;
    } else {
      if (val === '.' && current.includes('.')) return;
      current  = (current === '0' && val !== '.') ? val : current + val;
    }
    render();
  }

  document.querySelectorAll('.calc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      handle(btn.dataset.val);
      btn.classList.add('pressed');
      setTimeout(function () { btn.classList.remove('pressed'); }, 120);
    });
  });

  // Keyboard support (only when on calculator page)
  document.addEventListener('keydown', function (e) {
    var map = {
      'Enter':'=', 'Backspace':'⌫', 'Escape':'C',
      '/':'÷', '*':'×', '-':'−'
    };
    var v = map[e.key] || e.key;
    if (/^[0-9+.%]$/.test(v) || ['=','⌫','C','÷','×','−'].includes(v)) {
      handle(v);
    }
  });
})();

/* ──────────────────────────────────────────────
   BASIC CALCULATOR
────────────────────────────────────────────── */
(function initBasicCalc() {
  var input   = document.getElementById('basic-input');
  var btn     = document.getElementById('basic-calc-btn');
  var resultEl = document.getElementById('basic-result');
  var resultBox = document.getElementById('basic-result-box');
  var errorEl = document.getElementById('basic-error');
  if (!btn) return;

  function run() {
    errorEl.textContent = '';
    resultBox.style.display = 'none';
    var raw = input.value.trim();
    if (!raw) { errorEl.textContent = 'Please enter an expression.'; return; }
    try {
      var safe = raw.replace(/[^0-9+\-*/.() ]/g, '');
      /* eslint-disable-next-line no-new-func */
      var val = Function('"use strict";return(' + safe + ')')();
      if (!isFinite(val)) { errorEl.textContent = 'Invalid expression (division by zero?)'; return; }
      resultEl.textContent = parseFloat(val.toPrecision(12));
      resultBox.style.display = 'block';
    } catch (_) {
      errorEl.textContent = 'Invalid expression. Use numbers and +, -, *, /';
    }
  }

  btn.addEventListener('click', run);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
})();

/* ──────────────────────────────────────────────
   UNIT CONVERTER
────────────────────────────────────────────── */
(function initConverter() {
  var chipRow   = document.getElementById('chip-row');
  var fromSel   = document.getElementById('converter-from');
  var toSel     = document.getElementById('converter-to');
  var valInput  = document.getElementById('converter-value');
  var btn       = document.getElementById('converter-btn');
  var swapBtn   = document.getElementById('converter-swap');
  var catLabel  = document.getElementById('converter-cat-label');
  var resBox    = document.getElementById('converter-result-box');
  var resVal    = document.getElementById('converter-result-value');
  var resSub    = document.getElementById('converter-result-sub');
  var errEl     = document.getElementById('converter-error');
  if (!btn) return;

  var categories = {
    length: { label:'Length', units:[
      {label:'Meter (m)',factor:1},{label:'Kilometer (km)',factor:1000},
      {label:'Centimeter (cm)',factor:0.01},{label:'Millimeter (mm)',factor:0.001},
      {label:'Mile (mi)',factor:1609.344},{label:'Yard (yd)',factor:0.9144},
      {label:'Foot (ft)',factor:0.3048},{label:'Inch (in)',factor:0.0254},
      {label:'Nautical Mile',factor:1852},{label:'Micrometer (μm)',factor:1e-6},
      {label:'Nanometer (nm)',factor:1e-9}
    ]},
    weight: { label:'Weight', units:[
      {label:'Kilogram (kg)',factor:1},{label:'Gram (g)',factor:0.001},
      {label:'Milligram (mg)',factor:1e-6},{label:'Pound (lb)',factor:0.453592},
      {label:'Ounce (oz)',factor:0.0283495},{label:'Metric Ton',factor:1000},
      {label:'US Ton',factor:907.185},{label:'UK Ton',factor:1016.05},
      {label:'Stone',factor:6.35029}
    ]},
    temperature: {
      label:'Temperature',
      units:[{label:'Celsius (°C)',factor:1},{label:'Fahrenheit (°F)',factor:1},{label:'Kelvin (K)',factor:1}],
      convert: function(v, fromLabel, toLabel) {
        var c = v;
        if (fromLabel.includes('Fahrenheit')) c = (v-32)*5/9;
        else if (fromLabel.includes('Kelvin')) c = v-273.15;
        if (toLabel.includes('Fahrenheit')) return c*9/5+32;
        if (toLabel.includes('Kelvin')) return c+273.15;
        return c;
      }
    },
    time: { label:'Time', units:[
      {label:'Second (s)',factor:1},{label:'Millisecond (ms)',factor:0.001},
      {label:'Microsecond (μs)',factor:1e-6},{label:'Minute (min)',factor:60},
      {label:'Hour (h)',factor:3600},{label:'Day',factor:86400},
      {label:'Week',factor:604800},{label:'Month (avg)',factor:2628000},
      {label:'Year',factor:31536000}
    ]},
    area: { label:'Area', units:[
      {label:'Square Meter (m²)',factor:1},{label:'Square Kilometer (km²)',factor:1e6},
      {label:'Square Foot (ft²)',factor:0.092903},{label:'Square Yard (yd²)',factor:0.836127},
      {label:'Acre',factor:4046.86},{label:'Hectare (ha)',factor:10000}
    ]},
    volume: { label:'Volume', units:[
      {label:'Liter (L)',factor:1},{label:'Milliliter (mL)',factor:0.001},
      {label:'Cubic Meter (m³)',factor:1000},{label:'Cubic Foot (ft³)',factor:28.3168},
      {label:'Gallon (US)',factor:3.78541},{label:'Gallon (UK)',factor:4.54609},
      {label:'Pint (US)',factor:0.473176},{label:'Cup (US)',factor:0.236588}
    ]},
    speed: { label:'Speed', units:[
      {label:'m/s',factor:1},{label:'km/h',factor:0.277778},
      {label:'mph',factor:0.44704},{label:'Knot',factor:0.514444},
      {label:'ft/s',factor:0.3048}
    ]},
    fuel: {
      label:'Fuel Economy',
      units:[{label:'km/L',factor:1},{label:'L/100km',factor:1},{label:'MPG (US)',factor:0.425144},{label:'MPG (UK)',factor:0.354006}],
      convert: function(v, fromLabel, toLabel) {
        var kml = v;
        if (fromLabel==='L/100km') kml=100/v;
        else if (fromLabel==='MPG (US)') kml=v*0.425144;
        else if (fromLabel==='MPG (UK)') kml=v*0.354006;
        if (toLabel==='L/100km') return 100/kml;
        if (toLabel==='MPG (US)') return kml/0.425144;
        if (toLabel==='MPG (UK)') return kml/0.354006;
        return kml;
      }
    },
    energy: { label:'Energy', units:[
      {label:'Joule (J)',factor:1},{label:'Kilojoule (kJ)',factor:1000},
      {label:'Calorie (cal)',factor:4.184},{label:'Kilocalorie (kcal)',factor:4184},
      {label:'Watt-hour (Wh)',factor:3600},{label:'Kilowatt-hour (kWh)',factor:3.6e6},
      {label:'Electronvolt (eV)',factor:1.602e-19}
    ]},
    power: { label:'Power', units:[
      {label:'Watt (W)',factor:1},{label:'Kilowatt (kW)',factor:1000},
      {label:'Megawatt (MW)',factor:1e6},{label:'Horsepower (hp)',factor:745.7},
      {label:'BTU/hour',factor:0.29307}
    ]},
    frequency: { label:'Frequency', units:[
      {label:'Hertz (Hz)',factor:1},{label:'Kilohertz (kHz)',factor:1000},
      {label:'Megahertz (MHz)',factor:1e6},{label:'Gigahertz (GHz)',factor:1e9}
    ]},
    pressure: { label:'Pressure', units:[
      {label:'Pascal (Pa)',factor:1},{label:'Kilopascal (kPa)',factor:1000},
      {label:'Megapascal (MPa)',factor:1e6},{label:'Bar',factor:100000},
      {label:'PSI',factor:6894.76},{label:'Atmosphere (atm)',factor:101325},
      {label:'mmHg (Torr)',factor:133.322}
    ]},
    angle: { label:'Angle', units:[
      {label:'Degree (°)',factor:1},{label:'Radian (rad)',factor:57.2958},
      {label:'Gradian (grad)',factor:0.9}
    ]},
    storage: { label:'Data Storage', units:[
      {label:'Bit (b)',factor:1},{label:'Byte (B)',factor:8},
      {label:'Kilobyte (KB)',factor:8000},{label:'Megabyte (MB)',factor:8e6},
      {label:'Gigabyte (GB)',factor:8e9},{label:'Terabyte (TB)',factor:8e12},
      {label:'Petabyte (PB)',factor:8e15},{label:'Kibibyte (KiB)',factor:8192},
      {label:'Mebibyte (MiB)',factor:8388608}
    ]},
    datarate: { label:'Data Rate', units:[
      {label:'bps',factor:1},{label:'Kbps',factor:1000},
      {label:'Mbps',factor:1e6},{label:'Gbps',factor:1e9}
    ]},
    heat: { label:'Heat', units:[
      {label:'BTU',factor:1055.06},{label:'Joule (J)',factor:1},
      {label:'Calorie (cal)',factor:4.184},{label:'Kilocalorie (kcal)',factor:4184}
    ]},
    torque: { label:'Torque', units:[
      {label:'Newton-meter (N·m)',factor:1},{label:'Foot-pound (ft·lb)',factor:1.35582},
      {label:'Inch-pound (in·lb)',factor:0.112985}
    ]},
    force: { label:'Force', units:[
      {label:'Newton (N)',factor:1},{label:'Dyne',factor:1e-5},
      {label:'Pound-force (lbf)',factor:4.44822},{label:'Kilogram-force (kgf)',factor:9.80665}
    ]},
    density: { label:'Density', units:[
      {label:'kg/m³',factor:1},{label:'g/cm³',factor:1000},
      {label:'kg/L',factor:1000},{label:'lb/ft³',factor:16.0185}
    ]},
    concentration: { label:'Concentration', units:[
      {label:'mol/L (M)',factor:1},{label:'mmol/L (mM)',factor:0.001},
      {label:'ppm',factor:1e-6},{label:'ppb',factor:1e-9}
    ]},
    scientific: { label:'Scientific', units:[
      {label:'rad/s (ang. velocity)',factor:1},{label:'rpm (revolutions/min)',factor:0.10472},
      {label:'Gray (Gy)',factor:1},{label:'Sievert (Sv)',factor:1},
      {label:'Tesla (T)',factor:1},{label:'Gauss (G)',factor:1e-4}
    ]}
  };

  var currentCat = 'length';

  function populateUnits(cat) {
    [fromSel, toSel].forEach(function(sel, idx) {
      sel.innerHTML = '';
      categories[cat].units.forEach(function(u, i) {
        var opt = document.createElement('option');
        opt.value = i; opt.textContent = u.label;
        sel.appendChild(opt);
      });
      sel.value = idx === 1 ? '1' : '0';
    });
    if (catLabel) catLabel.textContent = categories[cat].label;
  }

  function setActiveChip(key) {
    document.querySelectorAll('.chip').forEach(function(c) {
      c.classList.toggle('active', c.dataset.cat === key);
    });
  }

  function doConvert() {
    errEl.textContent = '';
    resBox.style.display = 'none';
    var val = parseFloat(valInput.value);
    if (isNaN(val)) { errEl.textContent = 'Please enter a valid number.'; return; }
    var cat = categories[currentCat];
    var fromUnit = cat.units[+fromSel.value];
    var toUnit   = cat.units[+toSel.value];
    var res;
    if (cat.convert) {
      res = cat.convert(val, fromUnit.label, toUnit.label);
    } else {
      res = (val * fromUnit.factor) / toUnit.factor;
    }
    var fmt = (Math.abs(res) < 1e-6 || Math.abs(res) > 1e12)
      ? res.toExponential(6)
      : parseFloat(res.toPrecision(10)).toString();
    resVal.textContent = fmt + ' ' + toUnit.label;
    resSub.textContent = val + ' ' + fromUnit.label + ' = ' + fmt + ' ' + toUnit.label;
    resBox.style.display = 'block';
  }

  // Build chips
  if (chipRow) {
    Object.keys(categories).forEach(function(key) {
      var chip = document.createElement('button');
      chip.className = 'chip' + (key === currentCat ? ' active' : '');
      chip.dataset.cat = key;
      chip.textContent = categories[key].label;
      chip.addEventListener('click', function() {
        currentCat = key;
        populateUnits(key);
        setActiveChip(key);
        resBox.style.display = 'none';
        errEl.textContent = '';
      });
      chipRow.appendChild(chip);
    });
  }

  populateUnits(currentCat);

  btn.addEventListener('click', doConvert);
  valInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doConvert(); });
  swapBtn && swapBtn.addEventListener('click', function() {
    var tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    resBox.style.display = 'none';
  });
})();

/* ──────────────────────────────────────────────
   CURRENCY CONVERTER
────────────────────────────────────────────── */
(function initCurrency() {
  var amountInput = document.getElementById('currency-amount');
  var fromSel     = document.getElementById('currency-from');
  var toSel       = document.getElementById('currency-to');
  var btn         = document.getElementById('currency-btn');
  var swapBtn     = document.getElementById('currency-swap');
  var resBox      = document.getElementById('currency-result-box');
  var resEl       = document.getElementById('currency-result');
  var errEl       = document.getElementById('currency-error');
  if (!btn) return;

  var CURRENCIES = [
    {code:'USD',name:'US Dollar',flag:'🇺🇸'},{code:'EUR',name:'Euro',flag:'🇪🇺'},
    {code:'GBP',name:'British Pound',flag:'🇬🇧'},{code:'INR',name:'Indian Rupee',flag:'🇮🇳'},
    {code:'JPY',name:'Japanese Yen',flag:'🇯🇵'},{code:'AED',name:'UAE Dirham',flag:'🇦🇪'},
    {code:'AUD',name:'Australian Dollar',flag:'🇦🇺'},{code:'CAD',name:'Canadian Dollar',flag:'🇨🇦'},
    {code:'CHF',name:'Swiss Franc',flag:'🇨🇭'},{code:'CNY',name:'Chinese Yuan',flag:'🇨🇳'},
    {code:'SGD',name:'Singapore Dollar',flag:'🇸🇬'},{code:'HKD',name:'Hong Kong Dollar',flag:'🇭🇰'},
    {code:'KRW',name:'South Korean Won',flag:'🇰🇷'},{code:'BRL',name:'Brazilian Real',flag:'🇧🇷'},
    {code:'MXN',name:'Mexican Peso',flag:'🇲🇽'},{code:'ZAR',name:'South African Rand',flag:'🇿🇦'},
    {code:'SEK',name:'Swedish Krona',flag:'🇸🇪'},{code:'NOK',name:'Norwegian Krone',flag:'🇳🇴'},
    {code:'DKK',name:'Danish Krone',flag:'🇩🇰'},{code:'PLN',name:'Polish Zloty',flag:'🇵🇱'},
    {code:'TRY',name:'Turkish Lira',flag:'🇹🇷'},{code:'SAR',name:'Saudi Riyal',flag:'🇸🇦'},
    {code:'THB',name:'Thai Baht',flag:'🇹🇭'},{code:'MYR',name:'Malaysian Ringgit',flag:'🇲🇾'},
    {code:'IDR',name:'Indonesian Rupiah',flag:'🇮🇩'},{code:'PHP',name:'Philippine Peso',flag:'🇵🇭'},
    {code:'PKR',name:'Pakistani Rupee',flag:'🇵🇰'},{code:'BDT',name:'Bangladeshi Taka',flag:'🇧🇩'},
    {code:'EGP',name:'Egyptian Pound',flag:'🇪🇬'},{code:'NZD',name:'New Zealand Dollar',flag:'🇳🇿'},
    {code:'RUB',name:'Russian Ruble',flag:'🇷🇺'},{code:'UAH',name:'Ukrainian Hryvnia',flag:'🇺🇦'},
    {code:'QAR',name:'Qatari Riyal',flag:'🇶🇦'},{code:'KWD',name:'Kuwaiti Dinar',flag:'🇰🇼'},
  ];

  // Populate selects
  CURRENCIES.forEach(function(c) {
    var opt1 = document.createElement('option');
    opt1.value = c.code;
    opt1.textContent = c.flag + ' ' + c.code + ' – ' + c.name;
    fromSel.appendChild(opt1);

    var opt2 = opt1.cloneNode(true);
    toSel.appendChild(opt2);
  });
  fromSel.value = 'USD';
  toSel.value   = 'INR';

  async function convert() {
    errEl.textContent = '';
    resBox.style.display = 'none';
    var amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) { errEl.textContent = 'Please enter a valid amount.'; return; }
    var from = fromSel.value, to = toSel.value;
    btn.textContent = 'Fetching rates…';
    btn.disabled = true;
    try {
      var res  = await fetch('https://api.exchangerate-api.com/v4/latest/' + from);
      if (!res.ok) throw new Error('API error ' + res.status);
      var data = await res.json();
      var rate = data.rates[to];
      if (!rate) throw new Error('Currency not found: ' + to);
      var converted = amount * rate;
      var fromInfo = CURRENCIES.find(function(c){ return c.code===from; });
      var toInfo   = CURRENCIES.find(function(c){ return c.code===to; });
      resEl.innerHTML =
        '<div class="currency-result-main">' +
          (fromInfo ? fromInfo.flag : '') + ' ' +
          amount.toLocaleString() + ' ' + from + ' = <strong>' +
          (toInfo ? toInfo.flag : '') + ' ' +
          converted.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:4}) +
          ' ' + to + '</strong>' +
        '</div>' +
        '<div class="currency-result-rate">1 '+from+' = '+rate.toFixed(4)+' '+to+
          ' &nbsp;|&nbsp; 1 '+to+' = '+(1/rate).toFixed(4)+' '+from+'</div>' +
        '<div class="currency-result-time">Updated: '+new Date().toLocaleTimeString()+'</div>';
      resBox.style.display = 'block';
    } catch(e) {
      errEl.textContent = 'Failed to fetch rates: ' + e.message;
    } finally {
      btn.textContent = 'Convert';
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', convert);
  amountInput.addEventListener('keydown', function(e){ if(e.key==='Enter') convert(); });
  swapBtn && swapBtn.addEventListener('click', function() {
    var tmp = fromSel.value; fromSel.value = toSel.value; toSel.value = tmp;
    resBox.style.display = 'none';
  });
})();

/* ──────────────────────────────────────────────
   AGE CALCULATOR
────────────────────────────────────────────── */
(function initAge() {
  var dobInput    = document.getElementById('age-dob');
  var calcBtn     = document.getElementById('age-calc-btn');
  var resultBox   = document.getElementById('age-result-box');
  var yearsEl     = document.getElementById('age-years-display');
  var subEl       = document.getElementById('age-sub-display');
  var statsEl     = document.getElementById('age-stats');
  var bdayEl      = document.getElementById('age-bday');
  var errEl       = document.getElementById('age-error');
  if (!calcBtn) return;

  // Set max date to today
  var todayStr = new Date().toISOString().split('T')[0];
  if (dobInput) dobInput.max = todayStr;

  // Restrict year to 4 digits
  dobInput && dobInput.addEventListener('input', function() {
    var parts = this.value.split('-');
    if (parts[0] && parts[0].length > 4) {
      this.value = parts[0].slice(0,4) + (parts[1] ? '-'+parts[1] : '') + (parts[2] ? '-'+parts[2] : '');
    }
  });

  function calculate() {
    errEl.textContent = '';
    resultBox.style.display = 'none';
    if (!dobInput.value) { errEl.textContent = 'Please select a date of birth.'; return; }

    var birth = new Date(dobInput.value);
    var today = new Date(); today.setHours(0,0,0,0);

    if (birth > today) { errEl.textContent = 'Date of birth cannot be in the future.'; return; }
    if (birth.getFullYear() < 1000) { errEl.textContent = 'Please enter a valid 4-digit year.'; return; }

    var years  = today.getFullYear() - birth.getFullYear();
    var months = today.getMonth()    - birth.getMonth();
    var days   = today.getDate()     - birth.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) { years--; months += 12; }

    var totalDays  = Math.floor((today - birth) / 864e5);
    var totalWeeks = Math.floor(totalDays / 7);
    var totalHours = totalDays * 24;

    var nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBday < today) nextBday.setFullYear(nextBday.getFullYear() + 1);
    var daysToNext = Math.ceil((nextBday - today) / 864e5);

    yearsEl.innerHTML = years + ' <span>years</span>';
    subEl.textContent = months + ' months, ' + days + ' days';

    statsEl.innerHTML =
      stat(totalDays.toLocaleString(),  'Total Days')  +
      stat(totalWeeks.toLocaleString(), 'Total Weeks') +
      stat(totalHours.toLocaleString(), 'Total Hours');

    bdayEl.className = 'age-bday' + (daysToNext === 0 ? ' today' : '');
    bdayEl.textContent = daysToNext === 0
      ? '🎉 Happy Birthday Today!'
      : '🎁 Next birthday in ' + daysToNext + ' day' + (daysToNext !== 1 ? 's' : '');

    resultBox.style.display = 'block';
  }

  function stat(value, label) {
    return '<div class="age-stat"><span>' + value + '</span>' + label + '</div>';
  }

  calcBtn.addEventListener('click', calculate);
  dobInput && dobInput.addEventListener('keydown', function(e){ if(e.key==='Enter') calculate(); });
})();

/* ──────────────────────────────────────────────
   QR CODE GENERATOR
────────────────────────────────────────────── */
(function initQR() {
  var textInput   = document.getElementById('qr-text');
  var generateBtn = document.getElementById('qr-generate-btn');
  var container   = document.getElementById('qr-container');
  var qrImg       = document.getElementById('qr-img');
  var downloadBtn = document.getElementById('qr-download-btn');
  var copyBtn     = document.getElementById('qr-copy-btn');
  var preview     = document.getElementById('qr-text-preview');
  var errEl       = document.getElementById('qr-error');
  var sizeRow     = document.getElementById('qr-size-row');
  if (!generateBtn) return;

  var selectedSize = 256;

  // Size buttons
  if (sizeRow) {
    sizeRow.querySelectorAll('.qr-size-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        sizeRow.querySelectorAll('.qr-size-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        selectedSize = parseInt(btn.dataset.size);
      });
    });
  }

  var currentUrl = '';

  function generate() {
    errEl.textContent = '';
    container.style.display = 'none';
    var text = textInput.value.trim();
    if (!text) { errEl.textContent = 'Please enter text or a URL.'; return; }

    var encoded = encodeURIComponent(text);
    currentUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=' + selectedSize + 'x' + selectedSize +
                 '&data=' + encoded + '&format=png&ecc=M';

    qrImg.onload  = function() { container.style.display = 'block'; };
    qrImg.onerror = function() {
      errEl.textContent = 'Failed to generate QR code. Check your internet connection.';
      container.style.display = 'none';
    };
    qrImg.src = currentUrl;
    qrImg.width  = selectedSize;
    qrImg.height = selectedSize;

    if (preview) {
      preview.textContent = text.length > 60 ? text.slice(0, 60) + '…' : text;
    }
  }

  generateBtn.addEventListener('click', generate);
  textInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') generate(); });

  downloadBtn && downloadBtn.addEventListener('click', function() {
    if (!currentUrl) return;
    var a = document.createElement('a');
    a.href = currentUrl;
    a.download = 'qrcode.png';
    a.target = '_blank';
    a.click();
  });

  copyBtn && copyBtn.addEventListener('click', function() {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl).then(function() {
      var orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(function(){ copyBtn.textContent = orig; }, 1500);
    });
  });

  /* ── Mode tabs (single / batch) ── */
  var tabSingle = document.getElementById('qr-tab-single');
  var tabBatch  = document.getElementById('qr-tab-batch');
  var singleCard = document.getElementById('qr-single-card');
  var batchCard  = document.getElementById('qr-batch-card');

  function activateTab(mode) {
    if (mode === 'single') {
      singleCard && (singleCard.style.display = 'block');
      batchCard  && (batchCard.style.display  = 'none');
      tabSingle.style.background = 'rgba(255,215,0,.15)'; tabSingle.style.color = '#FFD700'; tabSingle.style.borderColor = 'rgba(255,215,0,.4)';
      tabBatch.style.background  = 'transparent';          tabBatch.style.color  = '#888';    tabBatch.style.borderColor  = 'rgba(255,255,255,.1)';
    } else {
      singleCard && (singleCard.style.display = 'none');
      batchCard  && (batchCard.style.display  = 'block');
      tabBatch.style.background  = 'rgba(255,215,0,.15)'; tabBatch.style.color  = '#FFD700'; tabBatch.style.borderColor  = 'rgba(255,215,0,.4)';
      tabSingle.style.background = 'transparent';          tabSingle.style.color = '#888';    tabSingle.style.borderColor = 'rgba(255,255,255,.1)';
    }
  }
  tabSingle && tabSingle.addEventListener('click', function() { activateTab('single'); });
  tabBatch  && tabBatch.addEventListener('click',  function() { activateTab('batch'); });
})();

/* ──────────────────────────────────────────────
   QR BATCH MODE
────────────────────────────────────────────── */
(function() {
  var batchBtn    = document.getElementById('qr-batch-btn');
  if (!batchBtn) return;

  var batchText   = document.getElementById('qr-batch-text');
  var batchError  = document.getElementById('qr-batch-error');
  var batchResults= document.getElementById('qr-batch-results');
  var batchGrid   = document.getElementById('qr-batch-grid');
  var batchCount  = document.getElementById('qr-batch-count');
  var sizeRow     = document.getElementById('qr-batch-size-row');
  var batchSize   = 200;

  if (sizeRow) {
    sizeRow.querySelectorAll('.qr-size-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        sizeRow.querySelectorAll('.qr-size-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        batchSize = +btn.dataset.size;
      });
    });
  }

  batchBtn.addEventListener('click', function() {
    batchError.textContent = '';
    var raw = batchText ? batchText.value : '';
    var lines = raw.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
    if (!lines.length) { batchError.textContent = 'Enter at least one item.'; return; }
    if (lines.length > 20) { batchError.textContent = 'Maximum 20 items allowed.'; return; }

    batchGrid.innerHTML = '';
    batchCount.textContent = 'Generating ' + lines.length + ' QR code' + (lines.length > 1 ? 's' : '') + '…';
    batchResults.style.display = 'block';

    var loaded = 0;
    lines.forEach(function(text, idx) {
      var encoded = encodeURIComponent(text);
      var url = 'https://api.qrserver.com/v1/create-qr-code/?size=' + batchSize + 'x' + batchSize + '&data=' + encoded + '&format=png&ecc=M';

      var wrap = document.createElement('div');
      wrap.style.cssText = 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;text-align:center;';

      var numEl = document.createElement('div');
      numEl.style.cssText = 'font-size:.7rem;color:#555;margin-bottom:8px;';
      numEl.textContent = '#' + (idx + 1);

      var imgWrap = document.createElement('div');
      imgWrap.style.cssText = 'display:inline-block;padding:8px;background:#fff;border-radius:8px;margin-bottom:10px;';

      var img = document.createElement('img');
      img.width = batchSize; img.height = batchSize;
      img.style.cssText = 'display:block;border-radius:4px;max-width:100%;';
      img.alt = 'QR ' + (idx + 1);
      img.onload = function() {
        loaded++;
        if (loaded === lines.length) {
          batchCount.textContent = lines.length + ' QR code' + (lines.length > 1 ? 's' : '') + ' generated';
        }
      };
      img.onerror = function() {
        loaded++;
        imgWrap.textContent = '⚠ Failed';
        imgWrap.style.cssText += 'color:#ff4444;font-size:.8rem;padding:20px 10px;';
      };
      img.src = url;

      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.72rem;color:#666;word-break:break-all;margin-bottom:10px;max-height:36px;overflow:hidden;line-height:1.4;';
      lbl.textContent = text.length > 40 ? text.slice(0, 40) + '…' : text;

      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.download = 'qr-' + (idx + 1) + '.png';
      a.className = 'btn btn-gold';
      a.style.cssText = 'font-size:.75rem;padding:6px 0;display:block;text-decoration:none;text-align:center;';
      a.textContent = '⬇ Download';

      imgWrap.appendChild(img);
      wrap.appendChild(numEl);
      wrap.appendChild(imgWrap);
      wrap.appendChild(lbl);
      wrap.appendChild(a);
      batchGrid.appendChild(wrap);
    });
  });
})();

/* ──────────────────────────────────────────────
   SIP CALCULATOR
────────────────────────────────────────────── */
(function() {
  var calcBtn   = document.getElementById('sip-calc-btn');
  if (!calcBtn) return;

  var monthlyIn = document.getElementById('sip-monthly');
  var rateIn    = document.getElementById('sip-rate');
  var yearsIn   = document.getElementById('sip-years');
  var errorEl   = document.getElementById('sip-error');

  var placeholder  = document.getElementById('sip-placeholder');
  var resultBox    = document.getElementById('sip-result-box');

  var elMaturity   = document.getElementById('sip-maturity');
  var elDuration   = document.getElementById('sip-duration-note');
  var elInvested   = document.getElementById('sip-invested');
  var elReturns    = document.getElementById('sip-returns');
  var elBarInvPct  = document.getElementById('sip-bar-invested-pct');
  var elBarRetPct  = document.getElementById('sip-bar-returns-pct');
  var elBarInv     = document.getElementById('sip-bar-invested');
  var elBarRet     = document.getElementById('sip-bar-returns');
  var elWealthGain = document.getElementById('sip-wealth-gain');
  var elMonthRate  = document.getElementById('sip-monthly-rate');
  var elTotalMo    = document.getElementById('sip-total-months');
  var elAvgMo      = document.getElementById('sip-avg-monthly');

  function formatINR(n) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(n);
  }

  calcBtn.addEventListener('click', function() {
    errorEl.textContent = '';

    var P = parseFloat(monthlyIn.value);
    var r = parseFloat(rateIn.value);
    var y = parseFloat(yearsIn.value);

    if (!monthlyIn.value || isNaN(P) || P <= 0)           { errorEl.textContent = 'Enter a valid monthly investment amount.'; return; }
    if (!rateIn.value    || isNaN(r) || r <= 0 || r > 100){ errorEl.textContent = 'Enter a valid annual return rate (1–100%).'; return; }
    if (!yearsIn.value   || isNaN(y) || y <= 0 || y > 150) { errorEl.textContent = 'Enter a valid duration (1–150 years).'; return; }

    var n = Math.round(y * 12);
    var i = r / 100 / 12;
    var maturity = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    var invested = P * n;
    var returns  = maturity - invested;

    var invPct = (invested / maturity) * 100;
    var retPct = (returns  / maturity) * 100;

    elMaturity.textContent  = formatINR(maturity);
    elDuration.textContent  = 'After ' + Math.round(y) + ' year' + (Math.round(y)===1?'':'s') + ' (' + n + ' months)';
    elInvested.textContent  = formatINR(invested);
    elReturns.textContent   = formatINR(returns);

    elBarInvPct.textContent = 'Invested (' + invPct.toFixed(1) + '%)';
    elBarRetPct.textContent = 'Returns ('  + retPct.toFixed(1) + '%)';
    elBarInv.style.width    = invPct.toFixed(2) + '%';
    elBarRet.style.width    = retPct.toFixed(2) + '%';

    elWealthGain.textContent = ((returns / invested) * 100).toFixed(1) + '%';
    elMonthRate.textContent  = (i * 100).toFixed(3) + '%';
    elTotalMo.textContent    = n;
    elAvgMo.textContent      = formatINR(returns / n);

    placeholder.style.display = 'none';
    resultBox.style.display   = 'block';
  });

  [monthlyIn, rateIn, yearsIn].forEach(function(el) {
    el && el.addEventListener('input', function() {
      placeholder.style.display = 'block';
      resultBox.style.display   = 'none';
      errorEl.textContent = '';
    });
  });
})();

/* ──────────────────────────────────────────────
   DOCUMENT CONVERTER
   Browser-side: img→pdf, pdf→img, merge, rotate, compress, split
────────────────────────────────────────────── */
(function () {
  var chipRow = document.getElementById('doc-chip-row');
  if (!chipRow) return;

  var typeLabel    = document.getElementById('doc-type-label');
  var acceptNote   = document.getElementById('doc-accept-note');
  var convertBtn   = document.getElementById('doc-convert-btn');
  var errorEl      = document.getElementById('doc-error');
  var statusBox    = document.getElementById('doc-status');
  var statusText   = document.getElementById('doc-status-text');

  var singleZone   = document.getElementById('doc-single-zone');
  var dropzone     = document.getElementById('doc-dropzone');
  var fileInput    = document.getElementById('doc-file-input');
  var fileInfo     = document.getElementById('doc-file-info');
  var fileName     = document.getElementById('doc-file-name');
  var fileSize     = document.getElementById('doc-file-size');
  var removeBtn    = document.getElementById('doc-file-remove');
  var dropTitle    = document.getElementById('doc-drop-title');
  var dropIcon     = document.getElementById('doc-drop-icon');

  var mergeZone    = document.getElementById('doc-merge-zone');
  var mergeList    = document.getElementById('doc-merge-list');
  var mergeAddBtn  = document.getElementById('doc-merge-add');
  var mergeInput   = document.getElementById('doc-merge-input');
  var mergeCountEl = document.getElementById('doc-merge-count');

  var splitOpts    = document.getElementById('doc-split-opts');
  var splitPages   = document.getElementById('doc-split-pages');
  var compressOpts = document.getElementById('doc-compress-opts');
  var imgFmtOpts   = document.getElementById('doc-img-format-opts');
  var rotateCtrl   = document.getElementById('doc-rotate-controls');
  var rotateGrid   = document.getElementById('doc-rotate-preview-grid');
  var rotateDisp   = document.getElementById('doc-rotate-angle-display');
  var rotL90       = document.getElementById('doc-rot-l90');
  var rotR90       = document.getElementById('doc-rot-r90');
  var rot180       = document.getElementById('doc-rot-180');
  var rotReset     = document.getElementById('doc-rot-reset');

  var resultCard   = document.getElementById('doc-result-card');
  var resultName   = document.getElementById('doc-result-name');
  var resultSub    = document.getElementById('doc-result-sub');
  var dlLink       = document.getElementById('doc-download-link');
  var anotherBtn   = document.getElementById('doc-convert-another');
  var resultImgs   = document.getElementById('doc-result-images');
  var imgGrid      = document.getElementById('doc-img-grid');
  var imgCount     = document.getElementById('doc-img-page-count');
  var imgFmtLabel  = document.getElementById('doc-img-format-label');
  var anotherBtn2  = document.getElementById('doc-convert-another2');
  var currentType  = 'img-pdf';
  var selectedFile = null;
  var mergeFiles   = [];
  var compressQual = 'medium';
  var imgFormat    = 'png';
  var globalRot    = 0;

  var TYPE_CFG = {
    'img-pdf':     { label:'IMAGE TO PDF',  accept:'.jpg,.jpeg,.png,.bmp,.tiff,.tif,.webp', icon:'🖼️', drop:'Drop your image here',   note:'Accepts: JPG, PNG, BMP, TIFF, WebP · Max 25 MB' },
    'pdf-img':     { label:'PDF TO IMAGE',  accept:'.pdf',                                  icon:'📄', drop:'Drop your PDF here',     note:'Accepts: .pdf · Max 25 MB' },
    'merge-pdf':   { label:'MERGE PDF',     accept:'.pdf,.jpg,.jpeg,.png,.webp,.bmp',        icon:'📄', drop:'',                       note:'Add PDFs and images below · Max 25 MB each' },
    'rotate-pdf':  { label:'ROTATE PDF',    accept:'.pdf',                                  icon:'🔄', drop:'Drop your PDF here',     note:'Accepts: .pdf · Max 25 MB' },
    'compress-pdf':{ label:'COMPRESS PDF',  accept:'.pdf',                                  icon:'🗜️', drop:'Drop your PDF here',     note:'Accepts: .pdf · Max 25 MB' },
    'split-pdf':   { label:'SPLIT PDF',     accept:'.pdf',                                  icon:'✂️', drop:'Drop your PDF here',     note:'Accepts: .pdf · Max 25 MB' }
  };

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function readAsDataURL(file) {
    return new Promise(function(res, rej) {
      var r = new FileReader(); r.onload = function(e){ res(e.target.result); }; r.onerror = rej; r.readAsDataURL(file);
    });
  }
  function loadImg(src) {
    return new Promise(function(res, rej) {
      var i = new Image(); i.onload = function(){ res(i); }; i.onerror = rej; i.src = src;
    });
  }
  function ensurePdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      return Promise.resolve(window.pdfjsLib);
    }
    return new Promise(function(res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = function() {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        res(window.pdfjsLib);
      };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function hideAll() {
    resultCard  && (resultCard.style.display  = 'none');
    resultImgs  && (resultImgs.style.display  = 'none');
  }
  function resetBtn() {
    convertBtn.disabled    = false;
    convertBtn.textContent = 'Convert Now';
    statusBox.style.display = 'none';
  }
  function showSingle(blob, name, desc) {
    resetBtn(); hideAll();
    resultName.textContent = name;
    resultSub.textContent  = desc + ' · ' + fmtBytes(blob.size);
    dlLink.setAttribute('download', name);
    dlLink.href = URL.createObjectURL(blob);
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function showPages(pages, base, fmt) {
    resetBtn(); hideAll();
    imgGrid.innerHTML = '';
    imgCount.textContent = pages.length + ' page' + (pages.length !== 1 ? 's' : '') + ' converted';
    if (imgFmtLabel) imgFmtLabel.textContent = fmt.toUpperCase();
    pages.forEach(function(p) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px;text-align:center;';
      var img = document.createElement('img');
      img.src = p.dataUrl;
      img.style.cssText = 'width:100%;max-height:180px;object-fit:contain;border-radius:6px;display:block;margin-bottom:8px;background:#111;';
      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.72rem;color:#555;margin-bottom:8px;';
      lbl.textContent = 'Page ' + p.num;
      var a = document.createElement('a');
      a.href = p.dataUrl;
      a.download = base + '-p' + p.num + '.' + fmt;
      a.className = 'btn btn-gold';
      a.style.cssText = 'font-size:.78rem;padding:7px 0;display:block;text-align:center;text-decoration:none;';
      a.textContent = '⬇ ' + fmt.toUpperCase();
      wrap.appendChild(img); wrap.appendChild(lbl); wrap.appendChild(a);
      imgGrid.appendChild(wrap);
    });
    resultImgs.style.display = 'block';
    resultImgs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function applyType(type) {
    currentType = type;
    var cfg = TYPE_CFG[type];
    typeLabel.textContent  = cfg.label;
    acceptNote.textContent = cfg.note;
    var isMerge = type === 'merge-pdf';
    singleZone.style.display = isMerge ? 'none' : 'block';
    mergeZone.style.display  = isMerge ? 'block' : 'none';
    splitOpts    && (splitOpts.style.display    = type === 'split-pdf'    ? 'block' : 'none');
    compressOpts && (compressOpts.style.display = type === 'compress-pdf' ? 'block' : 'none');
    imgFmtOpts   && (imgFmtOpts.style.display   = type === 'pdf-img'      ? 'block' : 'none');
    if (rotateCtrl) rotateCtrl.style.display = 'none';
    if (!isMerge) {
      if (dropIcon)  dropIcon.textContent  = cfg.icon;
      if (dropTitle) dropTitle.textContent = cfg.drop;
      if (fileInput) fileInput.accept      = cfg.accept;
    }
    clearSingle(); clearMerge(); hideAll();
    errorEl.textContent = '';
    globalRot = 0;
    if (rotateGrid) rotateGrid.innerHTML = '';
  }

  function clearSingle() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    if (fileInfo)  fileInfo.style.display  = 'none';
    if (dropzone)  dropzone.style.display  = 'block';
    updateBtn();
  }
  function clearMerge() {
    mergeFiles = [];
    if (mergeList) mergeList.innerHTML = '';
    updateMergeCount();
    updateBtn();
  }
  function updateMergeCount() {
    if (mergeCountEl) mergeCountEl.textContent = mergeFiles.length + ' file' + (mergeFiles.length !== 1 ? 's' : '') + ' added';
  }
  function updateBtn() {
    var ready = currentType === 'merge-pdf' ? mergeFiles.length >= 1 : !!selectedFile;
    convertBtn.disabled    = !ready;
    convertBtn.textContent = ready ? 'Convert Now' : 'Select a file to continue';
  }

  function setSingleFile(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { errorEl.textContent = 'File exceeds 25 MB limit.'; return; }
    errorEl.textContent = '';
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = fmtBytes(file.size);
    fileInfo.style.display  = 'flex';
    dropzone.style.display  = 'none';
    if (currentType === 'rotate-pdf') loadRotatePreview(file);
    updateBtn();
  }

  function addMergeFile(file) {
    if (mergeFiles.length >= 20) { errorEl.textContent = 'Maximum 20 files allowed.'; return; }
    if (file.size > 25 * 1024 * 1024) { errorEl.textContent = file.name + ' exceeds 25 MB.'; return; }
    mergeFiles.push(file);
    var item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;';
    var ico = document.createElement('span');
    ico.textContent = (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) ? '📄' : '🖼️';
    ico.style.fontSize = '1.1rem';
    var nm = document.createElement('span');
    nm.textContent = file.name;
    nm.style.cssText = 'flex:1;font-size:.85rem;color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    var sz = document.createElement('span');
    sz.textContent = fmtBytes(file.size);
    sz.style.cssText = 'font-size:.75rem;color:#555;white-space:nowrap;flex-shrink:0;';
    var idx = mergeFiles.length - 1;
    var rm = document.createElement('button');
    rm.textContent = '✕';
    rm.style.cssText = 'background:none;border:none;color:#555;cursor:pointer;font-size:1rem;padding:0 4px;flex-shrink:0;';
    rm.addEventListener('click', function() { mergeFiles.splice(idx, 1); rebuildMergeList(); });
    item.appendChild(ico); item.appendChild(nm); item.appendChild(sz); item.appendChild(rm);
    mergeList.appendChild(item);
    updateMergeCount(); updateBtn();
  }
  function rebuildMergeList() {
    var snap = mergeFiles.slice(); mergeFiles = []; mergeList.innerHTML = '';
    snap.forEach(addMergeFile);
    updateMergeCount(); updateBtn();
  }

  if (dropzone) {
    dropzone.addEventListener('click', function() { if (fileInput) fileInput.click(); });
    dropzone.addEventListener('dragover',  function(e) { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', function()  { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', function(e) { e.preventDefault(); dropzone.classList.remove('dragover'); if (e.dataTransfer.files[0]) setSingleFile(e.dataTransfer.files[0]); });
  }
  if (fileInput)   fileInput.addEventListener('change',  function() { if (fileInput.files[0]) setSingleFile(fileInput.files[0]); });
  if (removeBtn)   removeBtn.addEventListener('click',   clearSingle);
  if (mergeAddBtn) mergeAddBtn.addEventListener('click', function() { if (mergeInput) mergeInput.click(); });
  if (mergeInput)  mergeInput.addEventListener('change', function() { Array.from(mergeInput.files).forEach(addMergeFile); mergeInput.value = ''; });

  chipRow.querySelectorAll('.chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      chipRow.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      applyType(chip.dataset.type);
    });
  });

  if (imgFmtOpts) {
    imgFmtOpts.querySelectorAll('.chip').forEach(function(c) {
      c.addEventListener('click', function() {
        imgFmtOpts.querySelectorAll('.chip').forEach(function(x){ x.classList.remove('active'); });
        c.classList.add('active'); imgFormat = c.dataset.fmt;
      });
    });
  }
  if (compressOpts) {
    compressOpts.querySelectorAll('.chip').forEach(function(c) {
      c.addEventListener('click', function() {
        compressOpts.querySelectorAll('.chip').forEach(function(x){ x.classList.remove('active'); });
        c.classList.add('active'); compressQual = c.dataset.quality;
      });
    });
  }

  function loadRotatePreview(file) {
    if (rotateCtrl) rotateCtrl.style.display = 'none';
    if (rotateGrid) rotateGrid.innerHTML = '';
    statusBox.style.display = 'flex';
    statusText.textContent = 'Loading PDF preview…';
    convertBtn.disabled = true;
    ensurePdfJs().then(function(lib) {
      return file.arrayBuffer().then(function(buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function(pdf) {
      statusBox.style.display = 'none';
      rotateCtrl.style.display = 'block';
      if (rotateDisp) rotateDisp.textContent = 'Current rotation: 0°';
      var chain = Promise.resolve();
      var total = Math.min(pdf.numPages, 20);
      for (var i = 1; i <= total; i++) {
        (function(n) {
          chain = chain.then(function() {
            return pdf.getPage(n).then(function(page) {
              var vp = page.getViewport({ scale: 0.28 });
              var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() {
                var wrap = document.createElement('div');
                wrap.style.cssText = 'text-align:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:8px;';
                var img = document.createElement('img');
                img.src = cv.toDataURL('image/jpeg', 0.7);
                img.style.cssText = 'width:100%;border-radius:4px;display:block;margin-bottom:4px;transition:transform 0.3s ease;';
                img.dataset.page = n;
                var lbl = document.createElement('div');
                lbl.style.cssText = 'font-size:.7rem;color:#555;';
                lbl.textContent = 'p.' + n;
                wrap.appendChild(img); wrap.appendChild(lbl);
                rotateGrid.appendChild(wrap);
              });
            });
          });
        })(i);
      }
      return chain;
    }).then(function() { updateBtn(); }).catch(function(e) {
      statusBox.style.display = 'none';
      errorEl.textContent = 'Could not load PDF preview: ' + (e && e.message ? e.message : String(e));
      updateBtn();
    });
  }

  function applyRotDelta(delta) {
    globalRot = ((globalRot + delta) % 360 + 360) % 360;
    if (rotateDisp) rotateDisp.textContent = 'Current rotation: ' + globalRot + '°';
    if (rotateGrid) {
      rotateGrid.querySelectorAll('img[data-page]').forEach(function(img) {
        img.style.transform = 'rotate(' + globalRot + 'deg)';
      });
    }
  }
  rotL90   && rotL90.addEventListener('click',   function() { applyRotDelta(-90); });
  rotR90   && rotR90.addEventListener('click',   function() { applyRotDelta(90); });
  rot180   && rot180.addEventListener('click',   function() { applyRotDelta(180); });
  rotReset && rotReset.addEventListener('click', function() {
    globalRot = 0;
    if (rotateDisp) rotateDisp.textContent = 'Current rotation: 0°';
    if (rotateGrid) rotateGrid.querySelectorAll('img[data-page]').forEach(function(img) { img.style.transform = ''; });
  });

  /* ── conversion functions ── */
  function imgToPdf(file, cb, onErr) {
    readAsDataURL(file).then(function(du) {
      return loadImg(du).then(function(img) {
        var A4W = 595.28, A4H = 841.89;
        var s = Math.min(A4W / img.width, A4H / img.height, 1);
        var w = img.width * s, h = img.height * s;
        var or = img.width > img.height ? 'landscape' : 'portrait';
        var doc = new window.jspdf.jsPDF({ orientation: or, unit: 'pt', format: 'a4' });
        var pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
        doc.addImage(du, file.type === 'image/png' ? 'PNG' : 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h);
        cb(doc.output('blob'));
      });
    }).catch(onErr);
  }

  function pdfToImages(file, fmt, onProg, cb, onErr) {
    ensurePdfJs().then(function(lib) {
      return file.arrayBuffer().then(function(buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function(pdf) {
      var pages = [], chain = Promise.resolve(), total = pdf.numPages;
      for (var i = 1; i <= total; i++) {
        (function(n) {
          chain = chain.then(function() {
            onProg('Rendering page ' + n + ' / ' + total + '…');
            return pdf.getPage(n).then(function(page) {
              var vp = page.getViewport({ scale: 2 });
              var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() {
                var mime = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
                var q    = fmt === 'jpg' ? 0.88 : undefined;
                pages.push({ dataUrl: q ? cv.toDataURL(mime, q) : cv.toDataURL(mime), num: n });
              });
            });
          });
        })(i);
      }
      return chain.then(function() { cb(pages); });
    }).catch(onErr);
  }

  function mergePdfs(files, onProg, cb, onErr) {
    var A4W = 595.28, A4H = 841.89;
    ensurePdfJs().then(function() {
      var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
      var first = true, chain = Promise.resolve();
      files.forEach(function(file, fi) {
        chain = chain.then(function() {
          onProg('Processing ' + (fi + 1) + ' / ' + files.length + ': ' + file.name);
          var isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            return file.arrayBuffer().then(function(buf) {
              return window.pdfjsLib.getDocument({ data: buf }).promise;
            }).then(function(pdfDoc) {
              var pc = Promise.resolve();
              for (var pi = 1; pi <= pdfDoc.numPages; pi++) {
                (function(pn) {
                  pc = pc.then(function() {
                    return pdfDoc.getPage(pn).then(function(page) {
                      var vp = page.getViewport({ scale: 1.5 });
                      var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
                      return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() {
                        var img = cv.toDataURL('image/jpeg', 0.88);
                        if (!first) doc.addPage([A4W, A4H]); first = false;
                        var s = Math.min(A4W / vp.width, A4H / vp.height);
                        doc.addImage(img, 'JPEG', (A4W - vp.width * s) / 2, (A4H - vp.height * s) / 2, vp.width * s, vp.height * s);
                      });
                    });
                  });
                })(pi);
              }
              return pc;
            });
          } else {
            return readAsDataURL(file).then(function(du) {
              return loadImg(du).then(function(img) {
                if (!first) doc.addPage([A4W, A4H]); first = false;
                var s = Math.min(A4W / img.width, A4H / img.height, 1);
                var w = img.width * s, h = img.height * s;
                doc.addImage(du, file.type === 'image/png' ? 'PNG' : 'JPEG', (A4W - w) / 2, (A4H - h) / 2, w, h);
              });
            });
          }
        });
      });
      return chain.then(function() { cb(doc.output('blob')); });
    }).catch(onErr);
  }

  function rotatePdf(file, angle, onProg, cb, onErr) {
    var norm = ((angle % 360) + 360) % 360;
    var doc = null;
    ensurePdfJs().then(function(lib) {
      return file.arrayBuffer().then(function(buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function(pdf) {
      var chain = Promise.resolve(), total = pdf.numPages;
      for (var i = 1; i <= total; i++) {
        (function(n) {
          chain = chain.then(function() {
            onProg('Rotating page ' + n + ' / ' + total + '…');
            return pdf.getPage(n).then(function(page) {
              var vp = page.getViewport({ scale: 1.5, rotation: norm });
              var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() {
                var img = cv.toDataURL('image/jpeg', 0.88);
                var land = vp.width > vp.height;
                if (!doc) {
                  doc = new window.jspdf.jsPDF({ orientation: land ? 'landscape' : 'portrait', unit: 'pt', format: [vp.width, vp.height] });
                } else {
                  doc.addPage([vp.width, vp.height], land ? 'landscape' : 'portrait');
                }
                doc.addImage(img, 'JPEG', 0, 0, vp.width, vp.height);
              });
            });
          });
        })(i);
      }
      return chain.then(function() { if (!doc) throw new Error('No pages rendered'); cb(doc.output('blob')); });
    }).catch(onErr);
  }

  function compressPdf(file, qual, onProg, cb, onErr) {
    var scale = qual === 'high' ? 1.2 : qual === 'medium' ? 0.8 : 0.5;
    var jpegQ = qual === 'high' ? 0.82 : qual === 'medium' ? 0.60 : 0.35;
    var doc = null;
    ensurePdfJs().then(function(lib) {
      return file.arrayBuffer().then(function(buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function(pdf) {
      var chain = Promise.resolve(), total = pdf.numPages;
      for (var i = 1; i <= total; i++) {
        (function(n) {
          chain = chain.then(function() {
            onProg('Compressing page ' + n + ' / ' + total + '…');
            return pdf.getPage(n).then(function(page) {
              var origVp = page.getViewport({ scale: 1 });
              var vp     = page.getViewport({ scale: scale });
              var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() {
                var img  = cv.toDataURL('image/jpeg', jpegQ);
                var pw = origVp.width, ph = origVp.height, land = pw > ph;
                if (!doc) {
                  doc = new window.jspdf.jsPDF({ orientation: land ? 'landscape' : 'portrait', unit: 'pt', format: [pw, ph] });
                } else {
                  doc.addPage([pw, ph], land ? 'landscape' : 'portrait');
                }
                doc.addImage(img, 'JPEG', 0, 0, pw, ph);
              });
            });
          });
        })(i);
      }
      return chain.then(function() { if (!doc) throw new Error('No pages rendered'); cb(doc.output('blob')); });
    }).catch(onErr);
  }

  function splitPdf(file, rangeStr, onProg, cb, onErr) {
    ensurePdfJs().then(function(lib) {
      return file.arrayBuffer().then(function(buf) { return lib.getDocument({ data: buf }).promise; });
    }).then(function(pdf) {
      var total = pdf.numPages, pages = [];
      if (!rangeStr || !rangeStr.trim()) {
        for (var i = 1; i <= total; i++) pages.push(i);
      } else {
        rangeStr.split(',').forEach(function(part) {
          part = part.trim();
          var m = part.match(/^(\d+)-(\d+)$/);
          if (m) { for (var j = +m[1]; j <= +m[2]; j++) { if (j >= 1 && j <= total) pages.push(j); } }
          else { var n = +part; if (n >= 1 && n <= total) pages.push(n); }
        });
      }
      if (!pages.length) { onErr('No valid pages in range. PDF has ' + total + ' page' + (total > 1 ? 's' : '') + '.'); return; }
      var results = [], chain = Promise.resolve();
      pages.forEach(function(pn) {
        chain = chain.then(function() {
          onProg('Extracting page ' + pn + ' / ' + total + '…');
          return pdf.getPage(pn).then(function(page) {
            var vp = page.getViewport({ scale: 2 });
            var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
            return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() {
              results.push({ dataUrl: cv.toDataURL('image/png'), num: pn });
            });
          });
        });
      });
      return chain.then(function() { cb(results); });
    }).catch(onErr);
  }

  convertBtn.addEventListener('click', function() {
    errorEl.textContent = ''; hideAll();
    convertBtn.disabled = true; statusBox.style.display = 'flex';
    var msgs = ['Reading file…', 'Analysing…', 'Converting…', 'Optimising…', 'Finalising…'], mi = 0;
    statusText.textContent = msgs[0];
    var ticker = setInterval(function() { if (++mi < msgs.length) statusText.textContent = msgs[mi]; }, 800);
    function stopTicker() { clearInterval(ticker); }
    function onErr(e) {
      stopTicker(); statusBox.style.display = 'none';
      errorEl.textContent = typeof e === 'string' ? e : (e && e.message ? e.message : 'Conversion failed. Please try again.');
      resetBtn();
    }
    var cfg  = TYPE_CFG[currentType];
    var base = (selectedFile ? selectedFile.name : 'merged').replace(/\.[^.]+$/, '');

    if (currentType === 'img-pdf') {
      setTimeout(function() { stopTicker(); imgToPdf(selectedFile, function(blob) { showSingle(blob, base + '.pdf', 'PDF Document'); }, onErr); }, 2000);
    } else if (currentType === 'pdf-img') {
      stopTicker(); statusText.textContent = 'Rendering pages…';
      pdfToImages(selectedFile, imgFormat, function(msg) { statusText.textContent = msg; }, function(pages) { statusBox.style.display = 'none'; showPages(pages, base, imgFormat); }, onErr);
    } else if (currentType === 'merge-pdf') {
      stopTicker(); statusText.textContent = 'Preparing merge…';
      mergePdfs(mergeFiles.slice(), function(msg) { statusText.textContent = msg; }, function(blob) { statusBox.style.display = 'none'; showSingle(blob, 'merged.pdf', 'Merged PDF Document'); }, onErr);
    } else if (currentType === 'rotate-pdf') {
      if (globalRot === 0) { stopTicker(); statusBox.style.display = 'none'; errorEl.textContent = 'Use the rotation buttons above to rotate the PDF first.'; resetBtn(); return; }
      stopTicker(); statusText.textContent = 'Applying rotation…';
      rotatePdf(selectedFile, globalRot, function(msg) { statusText.textContent = msg; }, function(blob) { statusBox.style.display = 'none'; showSingle(blob, base + '-rotated.pdf', 'Rotated PDF'); }, onErr);
    } else if (currentType === 'compress-pdf') {
      stopTicker(); statusText.textContent = 'Compressing…';
      compressPdf(selectedFile, compressQual, function(msg) { statusText.textContent = msg; }, function(blob) { statusBox.style.display = 'none'; showSingle(blob, base + '-compressed.pdf', 'Compressed PDF'); }, onErr);
    } else if (currentType === 'split-pdf') {
      stopTicker(); statusText.textContent = 'Splitting pages…';
      splitPdf(selectedFile, splitPages ? splitPages.value : '', function(msg) { statusText.textContent = msg; }, function(pages) { statusBox.style.display = 'none'; showPages(pages, base, 'png'); }, onErr);
    }
  });

  function resetAll() {
    hideAll(); clearSingle(); clearMerge();
    errorEl.textContent = '';
    globalRot = 0;
    if (rotateGrid) rotateGrid.innerHTML = '';
    if (rotateCtrl) rotateCtrl.style.display = 'none';
  }
  anotherBtn  && anotherBtn.addEventListener('click',  resetAll);
  anotherBtn2 && anotherBtn2.addEventListener('click', resetAll);

  applyType('img-pdf');
})();

/* ──────────────────────────────────────────────
   IMAGE RESIZER
────────────────────────────────────────────── */
(function () {
  var dropzone = document.getElementById('resize-dropzone');
  if (!dropzone) return;

  var fileInput   = document.getElementById('resize-file-input');
  var fileInfo    = document.getElementById('resize-file-info');
  var fileNameEl  = document.getElementById('resize-file-name');
  var origDimsEl  = document.getElementById('resize-orig-dims');
  var fileSizeEl  = document.getElementById('resize-file-size');
  var removeBtn   = document.getElementById('resize-file-remove');
  var optCard     = document.getElementById('resize-options-card');
  var prevCard    = document.getElementById('resize-preview-card');
  var pctZone     = document.getElementById('resize-percent-zone');
  var pxZone      = document.getElementById('resize-pixels-zone');
  var widthIn     = document.getElementById('resize-width');
  var heightIn    = document.getElementById('resize-height');
  var lockChk     = document.getElementById('resize-lock-ratio');
  var customPct   = document.getElementById('resize-custom-pct');
  var fmtRow      = document.getElementById('resize-fmt-row');
  var jpgQualDiv  = document.getElementById('resize-jpg-quality');
  var qualSlider  = document.getElementById('resize-quality-slider');
  var qualVal     = document.getElementById('resize-quality-val');
  var resizeBtn   = document.getElementById('resize-btn');
  var errorEl     = document.getElementById('resize-error');
  var beforeImg   = document.getElementById('resize-before-img');
  var afterImg    = document.getElementById('resize-after-img');
  var beforeInfo  = document.getElementById('resize-before-info');
  var afterInfo   = document.getElementById('resize-after-info');
  var dlLink      = document.getElementById('resize-download-link');
  var anotherBtn  = document.getElementById('resize-another');

  var origFile = null, origImg = null;
  var resizeMode = 'percent', selectedPct = 50, outputFmt = 'same';

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  dropzone.addEventListener('click', function() { if (fileInput) fileInput.click(); });
  dropzone.addEventListener('dragover',  function(e) { e.preventDefault(); dropzone.style.borderColor = 'rgba(255,215,0,.6)'; });
  dropzone.addEventListener('dragleave', function()  { dropzone.style.borderColor = 'rgba(255,215,0,.25)'; });
  dropzone.addEventListener('drop', function(e) {
    e.preventDefault(); dropzone.style.borderColor = 'rgba(255,215,0,.25)';
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });
  if (fileInput) fileInput.addEventListener('change', function() { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

  function loadFile(file) {
    if (!file.type.startsWith('image/')) { if (errorEl) errorEl.textContent = 'Please select an image file.'; return; }
    if (file.size > 50 * 1024 * 1024)   { if (errorEl) errorEl.textContent = 'File too large (max 50 MB).'; return; }
    origFile = file;
    var reader = new FileReader();
    reader.onload = function(e) {
      origImg = new Image();
      origImg.onload = function() {
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (origDimsEl) origDimsEl.textContent = origImg.width + ' × ' + origImg.height + ' px';
        if (fileSizeEl) fileSizeEl.textContent = fmtBytes(file.size);
        if (fileInfo)   fileInfo.style.display  = 'flex';
        dropzone.style.display = 'none';
        if (optCard)    optCard.style.display   = 'block';
        if (prevCard)   prevCard.style.display  = 'none';
        if (errorEl)    errorEl.textContent     = '';
        if (widthIn)    widthIn.value  = origImg.width;
        if (heightIn)   heightIn.value = origImg.height;
      };
      origImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (removeBtn) removeBtn.addEventListener('click', function() {
    origFile = null; origImg = null;
    if (fileInfo)  fileInfo.style.display  = 'none';
    dropzone.style.display = 'block';
    if (fileInput) fileInput.value = '';
    if (optCard)   optCard.style.display   = 'none';
    if (prevCard)  prevCard.style.display  = 'none';
    if (errorEl)   errorEl.textContent     = '';
  });

  document.querySelectorAll('[data-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-mode]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      resizeMode = btn.dataset.mode;
      if (pctZone) pctZone.style.display = resizeMode === 'percent' ? 'block' : 'none';
      if (pxZone)  pxZone.style.display  = resizeMode === 'pixels'  ? 'block' : 'none';
    });
  });

  if (pctZone) {
    pctZone.querySelectorAll('.chip[data-pct]').forEach(function(c) {
      c.addEventListener('click', function() {
        pctZone.querySelectorAll('.chip[data-pct]').forEach(function(x) { x.classList.remove('active'); });
        c.classList.add('active');
        selectedPct = +c.dataset.pct;
        if (customPct) customPct.value = '';
      });
    });
  }

  if (widthIn && heightIn) {
    widthIn.addEventListener('input', function() {
      if (lockChk && lockChk.checked && origImg && origImg.height)
        heightIn.value = Math.round(+widthIn.value * origImg.height / origImg.width) || '';
    });
    heightIn.addEventListener('input', function() {
      if (lockChk && lockChk.checked && origImg && origImg.width)
        widthIn.value = Math.round(+heightIn.value * origImg.width / origImg.height) || '';
    });
  }

  if (fmtRow) {
    fmtRow.querySelectorAll('.chip').forEach(function(c) {
      c.addEventListener('click', function() {
        fmtRow.querySelectorAll('.chip').forEach(function(x) { x.classList.remove('active'); });
        c.classList.add('active');
        outputFmt = c.dataset.fmt;
        if (jpgQualDiv) jpgQualDiv.style.display = outputFmt === 'image/jpeg' ? 'block' : 'none';
      });
    });
  }

  if (qualSlider && qualVal) {
    qualSlider.addEventListener('input', function() { qualVal.textContent = qualSlider.value; });
  }

  if (resizeBtn) resizeBtn.addEventListener('click', function() {
    if (!origImg || !origFile) return;
    if (errorEl) errorEl.textContent = '';
    var tw, th;
    if (resizeMode === 'percent') {
      var pct = customPct && customPct.value ? +customPct.value : selectedPct;
      if (!pct || pct < 1 || pct > 5000) { if (errorEl) errorEl.textContent = 'Enter a percentage between 1 and 5000.'; return; }
      tw = Math.round(origImg.width  * pct / 100);
      th = Math.round(origImg.height * pct / 100);
    } else {
      tw = widthIn  ? +widthIn.value  : 0;
      th = heightIn ? +heightIn.value : 0;
      if (!tw || !th || tw < 1 || th < 1) { if (errorEl) errorEl.textContent = 'Enter valid width and height.'; return; }
    }
    tw = Math.min(tw, 8000); th = Math.min(th, 8000);
    var cv  = document.createElement('canvas'); cv.width = tw; cv.height = th;
    cv.getContext('2d').drawImage(origImg, 0, 0, tw, th);
    var mime    = outputFmt === 'same' ? (origFile.type || 'image/jpeg') : outputFmt;
    var quality = mime === 'image/jpeg' ? (+qualSlider.value / 100) : undefined;
    var dataUrl = quality ? cv.toDataURL(mime, quality) : cv.toDataURL(mime);
    var ext     = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    var outName = origFile.name.replace(/\.[^.]+$/, '') + '-resized.' + ext;
    if (beforeImg)  beforeImg.src = origImg.src;
    if (beforeInfo) beforeInfo.textContent = origImg.width + ' × ' + origImg.height + ' px · ' + fmtBytes(origFile.size);
    if (afterImg)   afterImg.src = dataUrl;
    if (afterInfo) {
      var approxBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
      afterInfo.textContent = tw + ' × ' + th + ' px · ~' + fmtBytes(approxBytes);
    }
    if (dlLink) { dlLink.href = dataUrl; dlLink.setAttribute('download', outName); }
    if (prevCard) { prevCard.style.display = 'block'; prevCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  });

  if (anotherBtn) anotherBtn.addEventListener('click', function() {
    origFile = null; origImg = null;
    if (fileInfo)  fileInfo.style.display  = 'none';
    dropzone.style.display = 'block';
    if (fileInput) fileInput.value = '';
    if (optCard)   optCard.style.display   = 'none';
    if (prevCard)  prevCard.style.display  = 'none';
    if (errorEl)   errorEl.textContent     = '';
  });
})();

/* ──────────────────────────────────────────────
   EMI CALCULATOR
────────────────────────────────────────────── */
(function () {
  var calcBtn = document.getElementById('emi-calc-btn');
  if (!calcBtn) return;

  var amountIn  = document.getElementById('emi-amount');
  var rateIn    = document.getElementById('emi-rate');
  var tenureIn  = document.getElementById('emi-tenure');
  var errorEl   = document.getElementById('emi-error');
  var pholder   = document.getElementById('emi-placeholder');
  var resultBox = document.getElementById('emi-result-box');
  var tenureSfx = document.getElementById('emi-tenure-suffix');
  var unitYrBtn = document.getElementById('emi-unit-yr');
  var unitMoBtn = document.getElementById('emi-unit-mo');
  var showTable = document.getElementById('emi-show-table');
  var tableWrap = document.getElementById('emi-table-wrap');
  var tableBody = document.getElementById('emi-table-body');
  var tableNote = document.getElementById('emi-table-note');
  var emiMo     = document.getElementById('emi-monthly');
  var emiNote   = document.getElementById('emi-note');
  var emiPrin   = document.getElementById('emi-principal');
  var emiInt    = document.getElementById('emi-interest');
  var emiTot    = document.getElementById('emi-total');
  var barPPct   = document.getElementById('emi-bar-principal-pct');
  var barIPct   = document.getElementById('emi-bar-interest-pct');
  var barP      = document.getElementById('emi-bar-principal');
  var barI      = document.getElementById('emi-bar-interest');

  var tenureUnit = 'years';
  var tableOpen  = false;

  function fmtINR(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }
  function fmt2(n) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
  }

  function setUnit(unit) {
    tenureUnit = unit;
    var yr = unit === 'years';
    if (unitYrBtn) { unitYrBtn.style.background = yr  ? 'rgba(255,215,0,.15)' : 'transparent'; unitYrBtn.style.color = yr  ? '#FFD700' : '#888'; }
    if (unitMoBtn) { unitMoBtn.style.background = !yr ? 'rgba(255,215,0,.15)' : 'transparent'; unitMoBtn.style.color = !yr ? '#FFD700' : '#888'; }
    if (tenureSfx) tenureSfx.textContent = yr ? 'yrs' : 'mo';
  }
  unitYrBtn && unitYrBtn.addEventListener('click', function() { setUnit('years'); });
  unitMoBtn && unitMoBtn.addEventListener('click', function() { setUnit('months'); });

  calcBtn.addEventListener('click', function() {
    if (errorEl) errorEl.textContent = '';
    var P = parseFloat(amountIn ? amountIn.value : '');
    var r = parseFloat(rateIn   ? rateIn.value   : '');
    var t = parseFloat(tenureIn ? tenureIn.value  : '');
    if (isNaN(P) || P <= 0)          { if (errorEl) errorEl.textContent = 'Enter a valid loan amount.'; return; }
    if (isNaN(r) || r <= 0 || r > 50){ if (errorEl) errorEl.textContent = 'Enter a valid interest rate (0.1–50%).'; return; }
    if (isNaN(t) || t <= 0)          { if (errorEl) errorEl.textContent = 'Enter a valid tenure.'; return; }

    var n = tenureUnit === 'years' ? Math.round(t * 12) : Math.round(t);
    if (n < 1 || n > 360) { if (errorEl) errorEl.textContent = 'Tenure must be between 1 and 360 months (30 years).'; return; }

    var mr = r / 100 / 12;
    var emi = mr === 0 ? P / n : (P * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
    var totalPay = emi * n;
    var totalInt = totalPay - P;
    var pp = (P / totalPay * 100).toFixed(1);
    var ip = (totalInt / totalPay * 100).toFixed(1);

    if (emiMo)   emiMo.textContent   = fmtINR(emi);
    if (emiNote) emiNote.textContent = 'for ' + n + ' month' + (n > 1 ? 's' : '') + ' @ ' + r + '% p.a.';
    if (emiPrin) emiPrin.textContent = fmtINR(P);
    if (emiInt)  emiInt.textContent  = fmtINR(totalInt);
    if (emiTot)  emiTot.textContent  = fmtINR(totalPay);
    if (barPPct) barPPct.textContent = 'Principal (' + pp + '%)';
    if (barIPct) barIPct.textContent = 'Interest (' + ip + '%)';
    if (barP)    barP.style.width    = pp + '%';
    if (barI)    barI.style.width    = ip + '%';

    if (pholder)   pholder.style.display   = 'none';
    if (resultBox) resultBox.style.display = 'block';

    if (tableBody) {
      tableBody.innerHTML = '';
      var balance  = P;
      var rowLimit = n <= 60 ? n : 24;
      for (var m = 1; m <= rowLimit; m++) {
        var interest  = balance * mr;
        var principal = emi - interest;
        balance -= principal;
        if (balance < 0) balance = 0;
        var tr = document.createElement('tr');
        tr.style.background = m % 2 === 0 ? 'rgba(255,255,255,.02)' : 'transparent';
        tr.innerHTML =
          '<td style="padding:7px 10px;">' + m + '</td>' +
          '<td style="padding:7px 10px;text-align:right;">' + fmt2(emi) + '</td>' +
          '<td style="padding:7px 10px;text-align:right;color:#FFD700;">' + fmt2(principal) + '</td>' +
          '<td style="padding:7px 10px;text-align:right;color:#FFA500;">' + fmt2(interest) + '</td>' +
          '<td style="padding:7px 10px;text-align:right;">' + fmt2(Math.max(0, balance)) + '</td>';
        tableBody.appendChild(tr);
      }
      if (tableNote) tableNote.textContent = rowLimit < n ? 'Showing first ' + rowLimit + ' of ' + n + ' months.' : '';
    }
    tableOpen = false;
    if (tableWrap) tableWrap.style.display = 'none';
    if (showTable) showTable.textContent = 'Show Amortization Schedule ▾';
  });

  if (showTable) showTable.addEventListener('click', function() {
    tableOpen = !tableOpen;
    if (tableWrap) tableWrap.style.display = tableOpen ? 'block' : 'none';
    showTable.textContent = tableOpen ? 'Hide Amortization Schedule ▴' : 'Show Amortization Schedule ▾';
    if (tableOpen && tableWrap) tableWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  [amountIn, rateIn, tenureIn].forEach(function(el) {
    el && el.addEventListener('input', function() {
      if (pholder)   pholder.style.display   = 'block';
      if (resultBox) resultBox.style.display = 'none';
      if (tableWrap) tableWrap.style.display = 'none';
      if (errorEl)   errorEl.textContent     = '';
    });
  });
})();
