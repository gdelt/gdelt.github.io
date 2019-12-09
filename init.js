// GLOBAL VARIABLES AND HASH-PARSE CODE TO RUN BEFORE AJAX CALLS (FOR MENU OPTIONS)

var LIVE = false, // no API calls until fully initialised
    VERBOSE = false, // verbose console reporting: append '&verbose' to end of URL and refresh page
    API_URL = '';

var t0 = performance.now();
var sources_loaded = 0;

// timer/debugging functions
function clog (msg) {
  var report = Math.round(performance.now() - t0)/1000 + ' - ' + msg;
  console.log(report);
}
function xp() { for(var i=0; i<QKEYS.length; i++) console.log(QKEYS[i] + ': "' + query[QKEYS[i]] + '"'); }

function c(x) { return JSON.parse(JSON.stringify(x)); } // deep copy (clone)

// Time/date globals
var end_date = moment(new Date());
var start_date = moment("2017-01-01 0:00 +0000", "YYYY-MM-DD HH:mm Z");
var dtft = 'DD-MMM-YYYY'; // date format

// COMPARE analysis globals
var compare_mode = false;
var datasets = {};
var dataname;

// dictionary to manage API arguments. DO NOT EDIT - order of keys is critical for system integrity.
var query = {
  'api':'doc', // 'doc' or 'geo' or 'tv'
  // shared DOC/GEO (QUERY) args: QKEYS.slice(1, 14)
  'query':'', 'domain':'', 'imagefacetone':'', 'imagenumfaces':'', 'imageocrmeta':'', 'imagetag':'',
  'imagewebcount':'', 'imagewebtag':'', 'sourcecountry':'', 'sourcelang':'', 'theme':'', 'tone':'', 'toneabs':'',
  // GEO QUERY args             : QKEYS.slice(14, 18)
  'geonear':'', 'geolocationcc':'', 'geolocationadm1':'', 'geolocation':'',
  // TV QUERY args              : QKEYS.slice(18, 23)
  'context':'', 'market':'', 'network':['BBCNEWS','CNN','FOXNEWS','RT','DW'], 'show':'', 'station':'',
  // DOC CONTENT only args:       QKEYS.slice(23, 27)
  'contentmode':'ArtList', 'maxrecords':'75', 'trans':false, 'sort':'',
  // DOC TIMELINE only args:      QKEYS.slice(27, 30)
  'timelinemode':'TimelineVol', 'timelinesmooth':'0', 'timezoom':'',
  // DOC CONTENT & TIMELINE args: QKEYS.slice(30, 35)
  'format':'', 'timespan':'1d', 'startdatetime':'', 'enddatetime':'', 'searchlang':'',
  // GEO only args:               QKEYS.slice(35, 39)
  'geomode':'PointData', 'geoformat':'', 'geotimespan':'1d', 'geogeores':'',
  // special handling args        QKEYS.slice(39, 40)
  'domainis': false,
  // TV args:                     QKEYS.slice(40, 45)
  'tvmode':'TimelineVol', 'datacomb':'', 'datanorm':'', 'last24':'', 'tvmaxrecords':''
};
var QKEYS = Object.keys(query).slice(); // fixed array of query dict keys so we can work with their indices

// This updates query dictionary and hash string
function update_query(u_key, u_val, buildhash = true) {
  if(VERBOSE) clog('updating ' + u_key + ' to ' + u_val);
  u_key = u_key.replace(/#/gi, '');   // remove hash symbol
  if(typeof(u_val) != typeof(true) && !u_val.length) { u_val = ''; }   // handle empty array values (except if boolean)
  if(u_key == 'timelinesmooth' && u_val == 0) { u_val = ''; }
  query[ u_key ] = u_val;
  // toggle time modes
  if(query.timespan == ''){ $('#datetime').prop('disabled', false);
    } else { $('#datetime').prop('disabled', true); }
  if(buildhash) { // action API call unless supressed
    action_query();
    iframe_zoom(2);
  }
}

// coordinates a new query
function action_query() {
  if(VERBOSE){ clog('action_query'); }
  var new_qry = build_hash();
  API_URL = api_call(new_qry.keys);
  location.href = '#' + new_qry.hash;
  // show query string and tags above iframe
  var title = query.query;
  if(query.imagetag) { title += ' imagetags: ' + query.imagetag }
  if(query.theme) { title += ' themes: ' + query.theme }
  title = title.replace(/,/gi,', ');        // add space after commas
  $("#iframe_title").text(title);
  // update URL link and iframe source
  $("#gdelt_api_call").text(API_URL).attr("href", c(API_URL));
  if(LIVE){
    if(API_URL.indexOf('TrendingTopics') > -1) { // use custom template handling
      API_URL = API_URL.replace(/&format=[^&]+/, '&format=json');
      if(API_URL.indexOf('&format=') == -1) API_URL += '&format=json';
      $("#iframe_title").text('Trending topics and phrases on TV');
      console.log(API_URL);
      $("#gdelt_iframe").attr("src", './trending_topics.html');
      return;
    }
    $("#gdelt_iframe").attr("src", API_URL);
  }
}

// function to build a hash string that can be easily parsed back to query dictionary
function build_hash() {
  if( VERBOSE && ['doc','geo','tv'].indexOf(query.api) == -1 ) { alert('query.api should be either doc, geo or tv'); }
  if(current_tab == 'tab_content') { var api_keys = QKEYS.slice(0,14).concat(QKEYS.slice(23,27)).concat(QKEYS.slice(30,35)); }
  if(current_tab == 'tab_timeline') { var api_keys = QKEYS.slice(0,14).concat(QKEYS.slice(27,30)).concat(QKEYS.slice(30,35)); }
  if(current_tab == 'tab_geo') { var api_keys = QKEYS.slice(0,18).concat(QKEYS.slice(35,39)); }
  if(current_tab == 'tab_tv') { var api_keys = QKEYS.slice(0,2).concat(QKEYS.slice(18,23)).concat(QKEYS.slice(28,29)).concat(QKEYS.slice(30,34)).concat(QKEYS.slice(40,45)); }
  if(current_tab != 'tab_geo') { if(query.timespan) { api_keys.splice(api_keys.indexOf('startdatetime'), 2); }}
  if(query.domainis) { api_keys.push('domainis'); }
  var hash = 'api=' + query.api;
  //var call = 'xxx';
  for(var i=1; i<api_keys.length; i++) {
    var key = api_keys[i];
    if(query[key] || key == 'query') { hash += '&' + key + '=' + query[key]; }
  }
  // api_keys is also useful for API URL constructor api_call(), so pass back
  return {'keys': api_keys, 'hash': hash};
}

// format a key/value pair for API call
function format_arg(k, v, sig) {
  // special cases that need argument in double quotes
  if(k == 'imagetag' || k == 'location') { v = '%22' + v + '%22'; }
  if(k == 'domain') { return 'domain:.' + v + '%20OR%20domainis:' + v; }
  if(v.substr(0,1) == '-') { return '-' + k + sig + v.substr(1); }
  return k + sig + v;
}


// construct the GDELT API call
function api_call(k) {
  var call = 'https://api.gdeltproject.org/api/v2/';
  call += query.api + '/' + query.api + '?query=' + query.query;
  for(var i=2; i<k.length; i++){ // skip 'api'/'query' args
    var val = query[ k[i] ];
    var key = c(k[i]).replace(/^[a-zA-Z]+mode/g, 'mode').replace(/^geo/g, ''); // remove xxxmode and 'geo..' prefixes
    // special cases
    if(!val || val.length == 0) { continue; } // skip empty or false arguments
    if(key == 'trans' && val) { call += '&trans=googtrans'; continue; }
    if(key == 'domain' && val && query.domainis) { key = 'domainis';  // change arg if checkbox true
    } else { if(key == 'domainis') { continue; } } // already handled by 'domain'
    // rule-based cases
    var ind = QKEYS.indexOf( k[i] );
    var sep = ['%20','&'][(ind >= 23) + 0];
    var sig = [ ':' ,'='][(ind >= 23) + 0];
    if(!$.isArray(val)) { val = [val]; }  // to array

    if(val.length == 1){   // single argument case
      if(key == 'context') { val[0] = '"' + val[0] + '"'; } // TV API context arguments require quotes
      if(key == 'domain') { call += sep + '(' + format_arg(key, val[0], sig) + ')';   // domain is complex query due to API quirk
      } else { call += sep + format_arg(key, val[0], sig); }
    } else {               // multiple arguments
      var signs = [];      // logical array of arguments' mathematical signs
      for(var j=0; j<val.length; j++) { signs.push( val[j].substr(0,1) == '-' ); }
      var all_neg = signs.every(function(x) { return x; }); // returns true if all array items are true
      if(key == 'imagetag') { if($('#imagetag_bool').is(":checked")) all_neg = true;} // manual AND selection for image/theme tags
      if(key == 'theme') { if($('#theme_bool').is(":checked")) all_neg = true;}       //  as above
      if(all_neg){ // interpret all negs with AND (i.e. sep '%20' or '&')
        for(var j=0; j<val.length; j++) { call += sep + format_arg(key, val[j], sig); }
      } else {     // interpret all pos with OR (assuming all positive as mixing pos/neg args with AND/OR makes no sense)
        call += sep + '(' + format_arg(key, val[0], sig);
        for(var j=1; j<val.length; j++) { call += '%20OR%20' + format_arg(key, val[j], sig); }
        call += ')';
      }
    }
  }

  if(VERBOSE) clog('api_call ' + call);
  if(call.indexOf('mode=Timeline') > 0) call += '&timezoom=yes'; // timezoom arg doesn't currently work in app, but does in opened links
  return call;
}


//------------------------------------------------------------------------------------------------

// PARSE URL HASH STRING FOR ARGUMENTS

var init_args, init_argset = {}, init_argset_keys,
    selectized_ids = ['searchlang', 'sourcecountry', 'sourcelang', 'sort', 'domain', 'contentmode', 'timelinemode',
                          'format', 'geolocationcc', 'geolocationadm1', 'geomode', 'imagetag', 'tvmode', 'network'];
var init_args0, compare_url;

function hash(){

  // initialise date range
  update_query('startdatetime', start_date.format('YYYYMMDDHHmmss'), buildhash = false);
  update_query('enddatetime', end_date.format('YYYYMMDDHHmmss'), buildhash = false);

  // no hash string provided
  if(window.location.hash == '') {
    if(VERBOSE) clog('on_load() end: no hash');
    return;
  }

  // initialise fields with any arguments received from URL hash
  init_args = window.location.hash
    .replace(/^#/i,'')      // remove hash symbol
    .replace(/%20/gi, ' ')  // replace '%20' joiner with '&'
    .replace(/%22/gi, '"')  // replace '%22' with "
    .split('&');

  init_args0 = init_args;

  // if hash is a COMPARE setting it needs special handling
  if(init_args[0] == 'compare') {
    if(VERBOSE) { clog('compare init start'); }
    compare_mode = true;  // initialise in Compare mode?
    for(var i=1; i<init_args.length; i++){
      var compare_arg = c(init_args[i]).split('=');
      var dataname = c(compare_arg[0]);
      compare_url = decodeURIComponent(c(compare_arg[1]));
      compare_url = compare_url.replace(/&format=[a-zA-Z]+/gi, '') + '&format=json'; // ensure correct format argument
      $.ajax({
        url: compare_url,
        type: 'GET',
        dataType: 'json',
        error: function(err) { if(VERBOSE) { clog('ajax call fail: ' + err); }},
        success: function(options) {
          datasets[dataname] = { 'name': dataname, 'url': compare_url, 'data': options };
          if(VERBOSE) { clog('comp data added for: ' + dataname); }
          clog('comp data added for: ' + dataname);
      	},
        async: false, // get synchronously
      });
    }
    init_argset_keys = ['timelinemode'];

    // initialise app inputs with one of the options
    new_init_args = compare_url
      .match(/query=.*/g)[0]
      .replace(/mode/g, 'timelinemode')
      .replace(/&format=json/g, '')
      .replace(/^#/i,'')      // remove hash symbol
      .replace(/%20/gi, ' ')  // replace '%20' joiner with '&'
      .replace(/%22/gi, '"')  // replace '%22' with "
      .split('&');

    init_args = ['api=doc'].concat(new_init_args);
    if(VERBOSE) { clog('compare init end'); }
  }

  // implement verbose reporting
  if(init_args.indexOf('verbose') > -1) {
    VERBOSE = true;
    var i = init_args.indexOf('verbose');
    init_args.splice(i);
  }

  // convert to dictionary
  for(var i=0; i<init_args.length; i++) {
    var arg = init_args[i].split('=');
    if(VERBOSE) if(i>0 && arg.length < 2) { alert('Error buiding init_argset: ' + arg); }
    if(arg[1] != '') { // no action if argument empty
      var val = arg[1].split(',');
      if(val.length == 1) val = val[0];
      init_argset[ arg[0] ] = val;
    }
  }

  // build init_argset dict of hash arguments, and use to update query dict
  init_argset_keys = Object.keys(init_argset); // unique keys

  for(var i=0; i<init_argset_keys.length; i++) {
    var id = init_argset_keys[i];
    update_query(id, init_argset[id], false);
  }
  // special case as timespan omission is significant
  if(init_argset_keys.indexOf('timespan') == -1) { update_query('timespan', '', false); }

  if(VERBOSE) clog('hash parsed');
}

function copyApiCall(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($("#gdelt_api_call").text()).select();
  document.execCommand("copy");
  $temp.remove();
}

hash();
