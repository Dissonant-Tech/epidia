
var $toolsElem = $("#tools");
var $descriptionElem = $('#description');

var toolList = [];

/**
 * Replaces substrings in baseStr using they keys in reDict with
 * the key's value. Searches for words surrounded by percentage sings
 * (i.e. '%WORD%') and replaces it with the value reDict['%WORD%'].
 *
 * Failing finding '%WORD%', stringReplace will then check if 'WORD' is
 * a key in reDict and if so, use that instead.
 *
 * @params {String} baseStr - The string to operate on
 * @returns {String} resultStr - The string that has been operated on
 */
function stringReplace(baseStr, reDict) {
    var resultStr = baseStr.replace(/%[^%]+%/g, function(match){
        if (reDict.hasOwnProperty(match)) {
            return reDict[match];
        } else if (reDict.hasOwnProperty(match.slice(1, -1))) {
            return reDict[match.slice(1, -1)];
        }
    });
    return resultStr;
}

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
 * @params {Object} list - List of tool objects
 */
function renderToolList(list) {
    var $toolList = $("<ul></ul>");
    var itemString = '<a data-url="%URL%" draggable="true" ondragstart="drag(event)" class="collection-item">%X-Epidia-Tool-Name%</a>';
    $.each(list, function(i, tool){
        var toolItem = stringReplace(itemString, tool);
        $toolList.append(toolItem);
    });
    $toolsElem.empty();
    $toolsElem.append($toolList);
}

/**
 * Renders tool description header. A form that allows editing of values
 *
 * @params {String} url - the url of the tool to render. used as an identifier.
 * @returns {Object} $header - jQuery object of elements
 */
function renderDescriptionHead(url) {
    var currTool;
    $.each(toolList, function(i, obj){
        if (obj.URL == url) {
            currTool = obj;
        }
    });

    $header = $('<form class="description-header container"></form>');
    var itemStr = '<div class="" row><label for="%KEY%">%KEY%:</label><input type="text" id="%KEY%" class="materialize-textarea" name="%VAL%" value="%VAL%"></div>';
    var longItemStr = '<div class="" row><label for="%KEY%">%KEY%:</label><textarea id="%KEY%" class="materialize-textarea" name="%KEY%">%VAL%</textarea></div>';
    var submitString = '<button class="btn waves-effect waves-light" type="submit" value="submit">Save<i class="mdi-content-save right"></i></button>';

    for (var key in currTool) {
        var item = '';

        // If text is long use text area
        if (currTool[key].length > 30) {
            item = stringReplace(longItemStr, {'%KEY%': key, '%VAL%': currTool[key]});
        } else {
            item = stringReplace(itemStr, {'%KEY%': key, '%VAL%': currTool[key]});
            
        }
        $header.append(item);
    }
    $header.append(submitString);
    return $header;
}

/**
 * Render tool descriptions
 *
 * @params {Object} description - javascript object of the tool to render
 */
function renderDescription(description) {
    var $list = $('<ul></ul>');
    var itemString = '<li class="collection-item"><span class="key">%KEY%:</span>%VAL%</li>';
    var $objList = $('<ul class="obj-list"></ul>');
    var objectString  = '<div class="object"><span class="key">%KEY%:</span></div>';

    for (var key in description) {
        if ($.isPlainObject(description[key])) {
            if (key == "argument") {
                continue;
            } else {
                var objItem = stringReplace(objectString, {'%KEY%': key});
                $objList.append(objItem);
                $objList.append(renderDescription(description[key]));
                $list.append($objList);
            }
        } else {
            var item = stringReplace(itemString, {'%KEY%': key, '%VAL%': description[key]});
            $list.append(item);
        }
    }
    return $list;
}

/**
 * Parsed the description of a tool from it's url
 *
 * @params {string} url - url of tool to render
 * @returns {Object} toolDescription - javascript object of tool description
 */
function parseToolDescription(url) {
    $.get(url, function(response){
        var xmlDoc = $.parseXML(response);
        var $xml = $(xmlDoc);
        var tool = $xml.find('tool');

        var description = parseDescription(tool);
        $descriptionElem.empty();
        $descriptionElem.append(renderDescriptionHead(url));
        $descriptionElem.append(renderDescription(description));
        $('.description-header').submit(onFormSubmit);
    });
}

function onFormSubmit() {
    console.log($descriptionElem.find('.description-header'));
    return false;
}

/**
 * Recursively parses the tool xml tag.
 *
 * @params {Object} toolXml - xml object of tool tag
 * @returns {Object} description - javascript object of tool tag
 */
function parseDescription(toolXml) {
    var description = {};

    // If root element, get tool name
    if (typeof toolXml[0] != "undefined")  {
        description.name = toolXml[0].getAttribute('name');
    }

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
 * Provide drag and drop functionality for items in tool list
 *
 * @params {Object} ev - event object
 */
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.getAttribute('data-url'));
}

function drop(ev) {
    ev.preventDefault();
    var url = ev.dataTransfer.getData("text");

    description = parseToolDescription(url);
}

/**
 * Iterates over html tool elements and parses each tool.
 * Appends tools to global variable toolList
 *
 * @params {Object} html - $.get() response parsed to html
 */
function parseToolList(html) {
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
}

/**
 * Parse, sort and render the tools
 *
 * @params {Object} html - parsed html 
 */
function setupTools(html) {
    parseToolList(html);

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
    renderToolList(toolList);
}

/**
 * Script starts here.
 *
 * This funciton uses an async call to retrieve tool data and sets off
 * the rest of the script.
 */
$.get("epidia/tools/index.html", function(response){
    var html = $.parseHTML(response);
    setupTools(html);
});
