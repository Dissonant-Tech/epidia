
var $toolsElem = $("#tools");
var toolList = [];

/**
 * Parses tool element
 *
 * @params {Object} el - Element
 * @returns {Object} tool - Tool object
 */
function parseTool(elem) {
  var currTool = {};
  var key, val;

  $.each(elem.childNodes, function(i, el){
    if (el.tagName == "DT") {
      key = el.innerText;
    } else if (el.tagName == "DD") {
      val = el.innerText;
      currTool[key] = val;
    }
  });
  return currTool;
}

/**
 * Renders Tool objects in ul element
 *
 * @params {Object} tools - Element with id tools
 * @params {Object} toolList - List of tool objects
 */
function renderTools(list) {
  var $toolList = $("<ul></ul>");
  var itemString = '<li data-url="%URL%" class="collection-item">%X-Epidia-Tool-Name%</li>';
  $.each(list, function(i, tool){
    var toolItem = itemString.replace(/%[^%]+%/g, function(key){
      return tool[key.slice(1, -1)];
    });
    $toolList.append(toolItem);
  });
  $toolsElem.append($toolList);
}

/**
 * Parsed the description of a tool from it's url
 *
 * @params {string} url - url of tool to render
 * @returns {Object} toolDescription - javascript object of tool description
 */
var tool;
function parseToolDescription(url) {
  $.get(url, function(response){
    var xmlDoc = $.parseXML(response);
    var $xml = $(xmlDoc);
    tool = $xml.find('tool');

    var description = parseDescription(tool);
    console.log(description);
    });
}

/**
 * Recursively parses the tool xml tag.
 *
 * @params {Object} toolXml - xml object of tool tag
 * @returns {Object} description - javascript object of tool tag
 */
function parseDescription(toolXml) {
  var description = {};

  $(toolXml).children().each(function(i, elem){
    if (elem.childElementCount > 0) {
      if (elem.hasAttribute('name')) {
        description[elem.getAttribute('name')] = parseDescription(elem);
      } else {
        description[elem.tagName] = parseDescription(elem);
      }
    } else {
      description[elem.tagName] = $(elem).text();
    }
  });
  return description;
}

/**
 * Adds click listeners to tool elements
 */
function addToolListeners() {
  var $description;

  $toolsElem.find('li').click(function(){
    var url = this.getAttribute("data-url");
    description = parseToolDescription(url);
  });
}


$.get("epidia/tools/index.html", function(response){
  var html = $.parseHTML(response);

  //NOTE: Could also match tags whos tagname is 'dt',
  $.each(html, function(i, el) {
    // Only need elements with an ID
    if (typeof el.id != "undefined") {
      // Who's IDs start with "/tools/"
      if (el.id.indexOf("/tools/") === 0) {
        var tool = parseTool(el);
        toolList.push(tool);
      }
    }
  });
  // Sort by X-Epidia-Tool-Name
  toolList.sort(function(a, b) {
    if (a["X-Epidia-Tool-Name"] < b["X-Epidia-Tool-Name"]) {
      return -1;
    }
    if (a["X-Epidia-Tool-Name"] > b["X-Epidia-Tool-Name"]) {
      return 1;
    }
    return 0;
  });
  renderTools(toolList);
  addToolListeners();
});
