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
    if (!yearsIn.value   || isNaN(y) || y <= 0 || y > 50) { errorEl.textContent = 'Enter a valid duration (1–50 years).'; return; }

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
────────────────────────────────────────────── */
(function() {
  var chipRow      = document.getElementById('doc-chip-row');
  if (!chipRow) return;

  var dropzone     = document.getElementById('doc-dropzone');
  var dropzone2    = document.getElementById('doc-dropzone2');
  var fileInput    = document.getElementById('doc-file-input');
  var fileInput2   = document.getElementById('doc-file-input2');
  var fileInfo     = document.getElementById('doc-file-info');
  var fileInfo2    = document.getElementById('doc-file-info2');
  var fileName     = document.getElementById('doc-file-name');
  var fileName2    = document.getElementById('doc-file-name2');
  var fileSize     = document.getElementById('doc-file-size');
  var fileSize2    = document.getElementById('doc-file-size2');
  var removeBtn    = document.getElementById('doc-file-remove');
  var removeBtn2   = document.getElementById('doc-file-remove2');
  var typeLabel    = document.getElementById('doc-type-label');
  var acceptNote   = document.getElementById('doc-accept-note');
  var dropTitle    = document.getElementById('doc-drop-title');
  var dropIcon     = document.getElementById('doc-drop-icon');
  var mergeSlot    = document.getElementById('doc-merge-slot');
  var splitOpts    = document.getElementById('doc-split-opts');
  var convertBtn   = document.getElementById('doc-convert-btn');
  var errorEl      = document.getElementById('doc-error');
  var statusBox    = document.getElementById('doc-status');
  var statusText   = document.getElementById('doc-status-text');
  /* result panels */
  var resultCard   = document.getElementById('doc-result-card');
  var resultName   = document.getElementById('doc-result-name');
  var resultSub    = document.getElementById('doc-result-sub');
  var downloadLink = document.getElementById('doc-download-link');
  var anotherBtn   = document.getElementById('doc-convert-another');
  var resultImages = document.getElementById('doc-result-images');
  var imgGrid      = document.getElementById('doc-img-grid');
  var imgPageCount = document.getElementById('doc-img-page-count');
  var anotherBtn2  = document.getElementById('doc-convert-another2');
  var unavailBox   = document.getElementById('doc-unavailable');
  var unavailType  = document.getElementById('doc-unavail-type');
  var unavailBack  = document.getElementById('doc-unavailable-back');

  var currentType   = 'img-pdf';
  var selectedFile  = null;
  var selectedFile2 = null;

  var typeConfig = {
    'pdf-word':    { label:'PDF to Word',        accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'📄', acceptNote:'Accepts: .pdf · Max 25 MB',                server:true  },
    'word-pdf':    { label:'Word to PDF',         accept:'.doc,.docx',                dropTitle:'Drop your Word file',   icon:'📝', acceptNote:'Accepts: .doc, .docx · Max 25 MB',         server:true  },
    'img-pdf':     { label:'Image to PDF',        accept:'.jpg,.jpeg,.png,.bmp,.tiff',dropTitle:'Drop your image here',  icon:'🖼️', acceptNote:'Accepts: JPG, PNG, BMP, TIFF · Max 25 MB', server:false },
    'pdf-img':     { label:'PDF to Image',        accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'📄', acceptNote:'Accepts: .pdf · Max 25 MB',                server:false },
    'merge-pdf':   { label:'Merge PDF',           accept:'.pdf',                      dropTitle:'Drop first PDF here',   icon:'📄', acceptNote:'Accepts: .pdf files · Max 25 MB each',     server:true  },
    'split-pdf':   { label:'Split PDF',           accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'📄', acceptNote:'Accepts: .pdf · Max 25 MB',                server:true  },
    'pdf-ppt':     { label:'PDF to PowerPoint',   accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'📄', acceptNote:'Accepts: .pdf · Max 25 MB',                server:true  },
    'ppt-pdf':     { label:'PowerPoint to PDF',   accept:'.ppt,.pptx',                dropTitle:'Drop your PPT here',    icon:'📑', acceptNote:'Accepts: .ppt, .pptx · Max 25 MB',        server:true  },
    'excel-pdf':   { label:'Excel to PDF',        accept:'.xls,.xlsx',                dropTitle:'Drop your Excel file',  icon:'📊', acceptNote:'Accepts: .xls, .xlsx · Max 25 MB',        server:true  },
    'pdf-excel':   { label:'PDF to Excel',        accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'📄', acceptNote:'Accepts: .pdf · Max 25 MB',                server:true  },
    'compress-pdf':{ label:'Compress PDF',        accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'🗜️', acceptNote:'Accepts: .pdf · Max 25 MB',                server:true  },
    'rotate-pdf':  { label:'Rotate PDF',          accept:'.pdf',                      dropTitle:'Drop your PDF here',    icon:'🔄', acceptNote:'Accepts: .pdf · Max 25 MB',                server:true  },
  };

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function hideAllResults() {
    if (resultCard)   resultCard.style.display   = 'none';
    if (resultImages) resultImages.style.display = 'none';
    if (unavailBox)   unavailBox.style.display   = 'none';
  }

  function applyType(type) {
    var cfg = typeConfig[type];
    currentType = type;
    typeLabel.textContent   = cfg.label;
    acceptNote.textContent  = cfg.acceptNote;
    dropTitle.textContent   = cfg.dropTitle;
    dropIcon.textContent    = cfg.icon;
    fileInput.accept        = cfg.accept;
    mergeSlot.style.display = type === 'merge-pdf' ? 'block' : 'none';
    splitOpts.style.display = type === 'split-pdf' ? 'block'  : 'none';
    clearFile(1);
    clearFile(2);
    errorEl.textContent = '';
    hideAllResults();
  }

  function clearFile(slot) {
    if (slot === 1) {
      selectedFile = null;
      fileInput.value = '';
      fileInfo.style.display = 'none';
      dropzone.style.display = 'block';
      updateBtn();
    } else {
      selectedFile2 = null;
      if (fileInput2) fileInput2.value = '';
      if (fileInfo2)  fileInfo2.style.display = 'none';
      if (dropzone2)  dropzone2.style.display = 'block';
    }
  }

  function setFile(file, slot) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { errorEl.textContent = 'File exceeds 25 MB limit.'; return; }
    errorEl.textContent = '';
    if (slot === 1) {
      selectedFile = file;
      fileName.textContent = file.name;
      fileSize.textContent = formatBytes(file.size);
      fileInfo.style.display = 'flex';
      dropzone.style.display = 'none';
      updateBtn();
    } else {
      selectedFile2 = file;
      fileName2.textContent = file.name;
      fileSize2.textContent = formatBytes(file.size);
      fileInfo2.style.display = 'flex';
      dropzone2.style.display = 'none';
    }
  }

  function updateBtn() {
    convertBtn.disabled    = !selectedFile;
    convertBtn.textContent = selectedFile ? 'Convert Now' : 'Select a file to continue';
  }

  function makeDragDrop(zone, input, slot) {
    zone.addEventListener('click',     function()  { input.click(); });
    zone.addEventListener('dragover',  function(e) { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', function()  { zone.classList.remove('dragover'); });
    zone.addEventListener('drop',      function(e) {
      e.preventDefault(); zone.classList.remove('dragover');
      var f = e.dataTransfer.files[0]; if (f) setFile(f, slot);
    });
    input.addEventListener('change', function() { if (input.files[0]) setFile(input.files[0], slot); });
  }

  makeDragDrop(dropzone, fileInput, 1);
  if (dropzone2 && fileInput2) makeDragDrop(dropzone2, fileInput2, 2);

  removeBtn  && removeBtn.addEventListener('click',  function() { clearFile(1); });
  removeBtn2 && removeBtn2.addEventListener('click', function() { clearFile(2); });

  chipRow.querySelectorAll('.chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      chipRow.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      applyType(chip.dataset.type);
    });
  });

  /* ── Image → PDF (jsPDF) ─────────────────────────────────────────── */
  function imgToPdf(file, onSuccess, onError) {
    var reader = new FileReader();
    reader.onerror = function() { onError('Could not read the image file.'); };
    reader.onload = function(e) {
      var dataUrl = e.target.result;
      var img = new Image();
      img.onerror = function() { onError('Could not load image. Please try a JPG or PNG file.'); };
      img.onload = function() {
        try {
          var A4_W = 595.28, A4_H = 841.89;
          var scale = Math.min(A4_W / img.width, A4_H / img.height, 1);
          var w = img.width * scale, h = img.height * scale;
          var orient = img.width > img.height ? 'landscape' : 'portrait';
          var pdf  = new window.jspdf.jsPDF({ orientation: orient, unit: 'pt', format: 'a4' });
          var pw   = pdf.internal.pageSize.getWidth();
          var ph   = pdf.internal.pageSize.getHeight();
          var fmt  = file.type.includes('png') ? 'PNG' : 'JPEG';
          pdf.addImage(dataUrl, fmt, (pw - w) / 2, (ph - h) / 2, w, h);
          onSuccess(pdf.output('blob'));
        } catch (err) { onError('PDF generation failed: ' + (err.message || err)); }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  /* ── PDF → Images (PDF.js) ───────────────────────────────────────── */
  function pdfToImages(file, onProgress, onSuccess, onError) {
    if (!window.pdfjsLib) {
      onError('PDF.js library failed to load. Please check your internet connection and reload the page.');
      return;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    file.arrayBuffer().then(function(buf) {
      return window.pdfjsLib.getDocument({ data: buf }).promise;
    }).then(function(pdf) {
      var total = pdf.numPages;
      var pages = [];
      var chain = Promise.resolve();
      for (var i = 1; i <= total; i++) {
        (function(n) {
          chain = chain.then(function() {
            onProgress('Rendering page ' + n + ' of ' + total + '…');
            return pdf.getPage(n).then(function(page) {
              var vp     = page.getViewport({ scale: 2.0 });
              var canvas = document.createElement('canvas');
              canvas.width  = vp.width;
              canvas.height = vp.height;
              return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
                .then(function() { pages.push({ dataUrl: canvas.toDataURL('image/png'), num: n }); });
            });
          });
        })(i);
      }
      return chain.then(function() { onSuccess(pages); });
    }).catch(function(err) {
      onError('Could not read this PDF. Make sure it is a valid, unencrypted PDF. (' + (err && err.message ? err.message : err) + ')');
    });
  }

  /* ── Result display helpers ──────────────────────────────────────── */
  function resetBtn() {
    convertBtn.disabled    = false;
    convertBtn.textContent = 'Convert Now';
    statusBox.style.display = 'none';
  }

  function showSingle(blob, outName, outLabel) {
    resetBtn();
    resultName.textContent = outName;
    resultSub.textContent  = outLabel + ' · ' + formatBytes(blob.size);
    downloadLink.setAttribute('download', outName);
    downloadLink.href = URL.createObjectURL(blob);
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showImages(pages, baseName) {
    resetBtn();
    imgGrid.innerHTML = '';
    imgPageCount.textContent = pages.length + ' page' + (pages.length === 1 ? '' : 's') + ' converted to PNG';
    pages.forEach(function(p) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:10px;text-align:center;';

      var img = document.createElement('img');
      img.src = p.dataUrl;
      img.alt = 'Page ' + p.num;
      img.style.cssText = 'width:100%;border-radius:6px;margin-bottom:8px;max-height:200px;object-fit:contain;background:#111;display:block;';

      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.74rem;color:#666;margin-bottom:8px;';
      lbl.textContent = 'Page ' + p.num;

      var a = document.createElement('a');
      a.href      = p.dataUrl;
      a.download  = baseName + '-page-' + p.num + '.png';
      a.className = 'btn btn-gold';
      a.style.cssText = 'font-size:.78rem;padding:7px 0;display:block;text-align:center;text-decoration:none;';
      a.textContent = '⬇ Download PNG';

      wrap.appendChild(img);
      wrap.appendChild(lbl);
      wrap.appendChild(a);
      imgGrid.appendChild(wrap);
    });
    resultImages.style.display = 'block';
    resultImages.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showUnavailable(label) {
    resetBtn();
    if (unavailType) unavailType.textContent = '"' + label + '"';
    if (unavailBox)  { unavailBox.style.display = 'block'; unavailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  /* ── Convert button ──────────────────────────────────────────────── */
  convertBtn.addEventListener('click', function() {
    if (!selectedFile) return;
    errorEl.textContent = '';
    convertBtn.disabled = true;
    hideAllResults();
    statusBox.style.display = 'flex';

    var messages = ['Reading file…', 'Analysing document…', 'Converting format…', 'Optimising output…', 'Almost done…'];
    var idx = 0;
    statusText.textContent = messages[0];
    var ticker = setInterval(function() { if (++idx < messages.length) statusText.textContent = messages[idx]; }, 650);

    var cfg      = typeConfig[currentType];
    var baseName = selectedFile.name.replace(/\.[^.]+$/, '');

    function stopTicker() { clearInterval(ticker); }
    function onError(msg) {
      stopTicker();
      statusBox.style.display = 'none';
      errorEl.textContent = typeof msg === 'string' ? msg : 'Conversion failed. Please try again.';
      resetBtn();
    }

    if (currentType === 'img-pdf') {
      setTimeout(function() {
        stopTicker();
        imgToPdf(selectedFile, function(blob) {
          showSingle(blob, baseName + '.pdf', 'PDF Document (.pdf)');
        }, onError);
      }, 2400);

    } else if (currentType === 'pdf-img') {
      setTimeout(function() {
        stopTicker();
        statusText.textContent = 'Starting PDF render…';
        statusBox.style.display = 'flex';
        pdfToImages(selectedFile, function(msg) {
          statusText.textContent = msg;
        }, function(pages) {
          statusBox.style.display = 'none';
          showImages(pages, baseName);
        }, onError);
      }, 600);

    } else {
      /* Server-side only — show informative notice, no fake download */
      setTimeout(function() {
        stopTicker();
        showUnavailable(cfg.label);
      }, 1800);
    }
  });

  function resetAll() { hideAllResults(); clearFile(1); clearFile(2); errorEl.textContent = ''; }

  anotherBtn  && anotherBtn.addEventListener('click',  resetAll);
  anotherBtn2 && anotherBtn2.addEventListener('click', resetAll);
  unavailBack && unavailBack.addEventListener('click',  resetAll);

  /* Start with Image → PDF selected (works offline) */
  var imgChip = chipRow.querySelector('[data-type="img-pdf"]');
  if (imgChip) { chipRow.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); }); imgChip.classList.add('active'); }
  applyType('img-pdf');
})();
