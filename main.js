
// INTERFACE ADJUSTMENTS
document.getElementById("searchTabInput").click();  // select default query tab
document.getElementById("contentTabOutput").click(); // select default query tab
$("input").focus(function() { this.select() });      // select all input text on focus

// maxrecords slider
var maxrec_slider = document.getElementById("maxrecords");
document.getElementById("maxrecordslab").innerHTML = maxrec_slider.value; // initialise
var smooth_slider = document.getElementById("timelinesmooth");
document.getElementById("timelinesmoothlab").innerHTML = smooth_slider.value; // initialise


// TIME/DATE

var daterange = $('input[name="daterange"]').daterangepicker({
  locale: { format: dtft },
  maxDate: end_date.format(dtft),
  minDate: start_date.format(dtft),
  startDate: start_date.format(dtft),
  endDate: end_date.format(dtft)
});

function updateDate(picker){ // read input widget and update data objects
  var start_date = picker.startDate.startOf('day');
  var end_date = picker.endDate.endOf('day');
  update_query('startdatetime', start_date.format('YYYYMMDDHHmmss'), buildhash = false);
  update_query('enddatetime', end_date.format('YYYYMMDDHHmmss'));
}

setTimeout(function() { // not sure why needed but without it listener fails to initialise
  $('#datetime').on('apply.daterangepicker', function(ev, picker) {
    updateDate(picker); 
  });
}, 1000);


// $(function() { daterange; }); // date range setup


// CONFIGURE TABS

function manageInputTabs(evt, tabName) {
  var inputTabContent = document.getElementsByClassName("inputTab");
  for (var i = 0; i < inputTabContent.length; i++) { inputTabContent[i].style.display = "none"; }
  var inputTabLinks = document.getElementsByClassName("inputTabLinks");
  for (var i = 0; i < inputTabLinks.length; i++) {
    inputTabLinks[i].className = inputTabLinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
  // iframe_zoom(2);
}

var current_tab = 'tab_content'; // global

function manageOutputTabs(evt, tabName) {
  var outputTabContent = document.getElementsByClassName("outputTab");
  for (i = 0; i < outputTabContent.length; i++) { outputTabContent[i].style.display = "none"; }
  var outputTabLinks = document.getElementsByClassName("outputTabLinks");
  for (i = 0; i < outputTabLinks.length; i++) {
    outputTabLinks[i].className = outputTabLinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  // trigger changes on tab switch
  if(tabName == 'tab_content') {
    if(VERBOSE) { clog('switch to tab_content'); }
    current_tab = 'tab_content';
    $('#doc_results_options').appendTo("#tab_content"); // ie. move output options to this tab
    $('#maxrecordsdiv').show();
    $('#sortdiv').show();
    $('#analysis_buttons_div').hide();
    $('#timelinesmoothdiv').hide();
    if(LIVE){ update_query('api', 'doc'); }
  }
  if(tabName == 'tab_timeline') {
    if(VERBOSE) clog('switch to tab_timeline');
    current_tab = 'tab_timeline';
    $('#doc_results_options').appendTo("#tab_timeline");
    $('#timelinesmoothdiv').show();
    $('#maxrecordsdiv').hide();
    $('#sortdiv').hide();
    $('#analysis_buttons_div').show();
    if(LIVE){ update_query('api', 'doc'); }
  }
  if(tabName == 'tab_geo') {
    if(VERBOSE) clog('switch to tab_geo');
    current_tab = 'tab_geo';
    if(LIVE){ update_query('api', 'geo'); }
  }
  if(tabName == 'tab_tv') {
    current_tab = 'tab_tv';
    $('#doc_results_options').appendTo("#tab_tv");
    $('#timelinesmoothdiv').show();
    $('#maxrecordsdiv').hide();
    $('#sortdiv').hide();
    $('#analysis_buttons_div').show();
    if(LIVE){ update_query('api', 'tv'); }
  }
  // iframe_zoom(2);
}


// update non-selectize elements with hash arguments
if(window.location.hash != ''){
  for(var i=0; i<init_argset_keys.length; i++) {
    var id = init_argset_keys[i];
    if(id != 'api' && selectized_ids.indexOf(id) == -1) {
      if(VERBOSE) clog('set ' + id + ' element value to ' + init_argset[id]);
      if(['startdatetime','enddatetime'].indexOf(id) == -1){
        if(['trans','domainis'].indexOf(id) > -1){
          document.getElementById(id).checked = query[id];         // checkboxes
        } else { if(id != 'timezoom') document.getElementById(id).value = query[id]; }  // text inputs
      } else {
        if(id == 'startdatetime'){
          var sd = init_argset.startdatetime; // 20170405000000
          var ed = init_argset.enddatetime;   // 20170406235959
          $('#datetime').daterangepicker({
            startDate: [sd.substr(4,2), sd.substr(6,2), sd.substr(0,4)].join('/'), 
            endDate: [ed.substr(4,2), ed.substr(6,2), ed.substr(0,4)].join('/') 
          });
          $('#timespan').val('')
          updateDate( $('#datetime').data('daterangepicker') );
        }
      }
      if(id == 'maxrecords') document.getElementById('maxrecordslab').innerHTML = init_argset[id];
      if(id == 'timelinesmooth') document.getElementById('timelinesmoothlab').innerHTML = init_argset[id];
    }
  }
}


// LOAD MENU OPTIONS AND CONFIGURE INPUT SELECT ELEMENTS

function selectize_blur(id) {
  var select = $(id).selectize();
  var selectize = select[0].selectize;
  selectize.blur();
}

function selectize_add_new(id, vals) {
  if(!$.isArray(vals)) vals = [vals];
  var d = [];
  for(var i=0; i<vals.length; i++) { d.push({'name':vals[i],'code':vals[i]}); }
  var $select = $(id).selectize();
  var selectize = $select[0].selectize;
  selectize.addOption(d);
  for(var i=0; i<vals.length; i++) { selectize.addItem(d[i].name); }
  if(VERBOSE) clog('selectize add: ' + id + ' [' + vals + ']');
}

function selectize_element (id, max_items, options, title) {
  if(max_items > 0) {
    $(id).selectize({
      valueField: 'code',
      labelField: 'name',
      searchField: 'name',
      maxItems: max_items,
      options: options,
      create: true,
      persist: false,
      delimiter: ',',
      allowEmptyOption: true
    });

    var id0 = c(id).replace(/#/, '');
    if(query[id0]) { selectize_add_new(id, query[id0]); }
  }
  $(id + ' + div').attr('title', title); // add title tooltip
  $(id).change(function() { update_query(c(id), c($(id).val())); }); // event listener
}

function load_menu_data (fn, ids, max_items, title) {
  //if(VERBOSE) clog(fn + ' start');
  $.ajax({
    url: fn,
    type: 'GET',
    dataType: 'json',
    error: function(err) { clog(err); },
    success: function(options) {
      if(fn == "data/LOOKUP-IMAGETAGS.json" || fn == "data/LOOKUP-GKGTHEMES.json"){
        for(var i=0; i<options.length; i++) { options[i].name = options[i].code + ' (' + options[i].n + ')'; }
      }
      if(fn == "//api.gdeltproject.org/api/v2/tv/tv?mode=stationdetails&format=json"){
        options = options.station_details;
        for(var i=0; i<options.length; i++) {
          options[i].code = options[i].StationID;
          options[i].name = options[i].Description;
          options = options.filter(function (item) {
            var live = moment(new Date()) - moment(item.EndDate) < 604800000;
            var nat_int = ['International','National'].indexOf(item.Market) > -1;
            var cspan = ['CSPAN2','CSPAN3'].indexOf(item.StationID) == -1;
            return live && nat_int && cspan;
          });
        }
      }
      // selectize each associated DOM element
      for(var i=0; i<ids.length; i++) { selectize_element(ids[i], max_items[i], options, title[i]); }
      sources_loaded++;
      if(sources_loaded == 11) { if(VERBOSE) { clog('LOAD COMPLETE'); }}
  	},
  });
}

// load selection option sets and append as options to DOM. Adds title tooltips to new elements
load_menu_data("data/LOOKUP-IMAGETAGS.json", ['#imagetag'], [7], ['Every image processed by GDELT is assigned one or more topical tags from a universe of more than 10,000 objects and activities recognized by Google']);
load_menu_data("data/LOOKUP-GKGTHEMES.json", ['#theme'], [7], ['Searches for any of the GDELT Global Knowledge Graph (GKG) Themes. GKG Themes offer a powerful way of searching for complex topics, since there can be numerous different phrases or names under a single heading. Key in likely relevant themes to find matching options. Words on the left denote the semantic hierarchy.']);
load_menu_data("data/LOOKUP-LANGUAGES.json", ['#searchlang','#sourcelang'], [1,7], ['','Language(s) of the content you are searching for. GDELT handles the interpretation']); // searchlang deprecated, but new local lang API anticipated
load_menu_data("data/LOOKUP-COUNTRIES.json", ['#sourcecountry','#geolocationcc'], [7,7], ['Country or countries where the target content has originated','Specify country of media mentions']);
load_menu_data("data/LOOKUP-ADM1.json", ['#geolocationadm1'], [7], ['Specify ADM1 (top sub-national) geographical region of media mentions']);
load_menu_data("data/lookup-sort.json", ['#sort'], [1], ['By default results are sorted by relevance. You can also sort by date or article tone instead']);
load_menu_data("data/lookup-domain.json", ['#domain'], [7], ['Web domain of target content - e.g. "cnn.com"']);
load_menu_data("data/lookup-mode.json", ['#contentmode'], [1], ['GDELT modes for investigating source content']);
load_menu_data("data/lookup-timeline.json", ['#timelinemode'], [1], ['GDELT modes for investigating trends over time']);
load_menu_data("data/lookup-tv.json", ['#tvmode'], [1], ['GDELT modes for investigating television trends']);
load_menu_data("data/lookup-format.json", ['#format'], [1], ['Data formats for data export']);
load_menu_data("data/lookup-geo_mode.json", ['#geomode'], [1], ['GDELT modes for investigating geographical references within the content. This use GDELT\'s 7 day GEO API.']);
load_menu_data("data/lookup-geo_format.json", ['#geoformat'], [1], ['Data formats for data export']);
load_menu_data("//api.gdeltproject.org/api/v2/tv/tv?mode=stationdetails&format=json", ['#network'], [7], ['TV networks - national and international.']);
// load_menu_data("data/LOOKUP-STATIONS.json", ['#network'], [7], ['TV networks - national and international.']);

// EVENT HANDLERS

var timeout = null; // global timer to perform actions 0.5s after input activity has stopped

function pad (str, max) { str = str.toString(); return str.length < max ? pad("0" + str, max) : str; }

function manage_event(id, target, report, val) {
  var input = document.getElementById(id);
  if(typeof report != "undefined"){ document.getElementById(report).innerHTML = c(input.value); }
  clearTimeout(timeout);
  timeout = setTimeout(function () {
    update_query(target, input.value);
  }, 500);
}

$("#query").keyup(function(){ manage_event('query', 'query') } );
$("#timespan").keyup(function(){ manage_event('timespan', 'timespan') } );
$("#maxrecords").on('input', function(){ manage_event('maxrecords', 'maxrecords', 'maxrecordslab') } );
$("#timelinesmooth").on('input', function(){ manage_event('timelinesmooth', 'timelinesmooth', 'timelinesmoothlab') } );
$("#geotimespan").on('input', function(){ manage_event('geotimespan', 'geotimespan') } );
$("#geolocation").keyup(function(){ manage_event('geolocation', 'geolocation' )} );
$("#geogeores").keyup(function(){ manage_event('geogeores', 'geogeores') } );
$("#geonear").keyup(function(){ manage_event('geonear', 'geonear') } );
$("#context").keyup(function(){ manage_event('context', 'context') } );


// ensure checkboxes initialise matching query dict
document.getElementById('domainis').checked = query.domainis;
document.getElementById('trans').checked = query.trans;
// checkbox event handlers
function checkboxDomain() { update_query('domainis', !query.domainis); }
function checkboxTrans() { update_query('trans', !query.trans); } // translate non-English content
function checkboxImageBool() { action_query(); } // Image tag boolean option
function checkboxThemeBool() { action_query(); } // Theme tag boolean option

// select relevant tab if not 'CONTENT'
if(init_argset_keys){
  if(init_argset.api == 'geo') {
    document.getElementById("geoTabOutput").click();
  } else {
    if(init_argset.api == 'tv'){
      document.getElementById("tvTabOutput").click();
    } else { if(init_argset_keys.indexOf('timelinemode') > -1) { document.getElementById("timelineTabOutput").click(); }}
  }
  if(!query.query) { // if no query argument and there is an imagetag/theme argument, select that tab
    if(query.imagetag) {
      document.getElementById("imageTabInput").click();
    } else { if(query.theme) { document.getElementById("themeTabInput").click(); }}
  }
}

// start the fun
$(window).bind("load", function() {
  LIVE = true;
  update_query('api', query.api);
  $('#query').focus();
  if(compare_mode){
    document.getElementById("analysis_datacount").innerHTML = Object.keys(datasets).length;
    action_analysis();
  }
  resize_panels();
});
