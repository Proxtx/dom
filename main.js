import { watcher } from "@proxtx/watcher";
import { stringify } from "@proxtx/html/string.js";
import { parse } from "@proxtx/html";

/**
 * creates a watcher (proxtx/watcher) with dom methods and attributes (readme.md)
 * @param {Array} elementList Result of parse (proxtx/html)
 * @returns A watcher (proxtx/watcher) with dom methods and attributes (readme.md)
 */
export const Dom = (elementList) => {
  let wo = watcher({
    /**
     * Finds the element with the given id
     * @param {String} id The id of the desired node
     * @returns An Element with the desired id
     */
    getElementById: (id) => {
      return Element(
        query(elementList, (elem) => {
          if (!elem.attributes) return;
          for (let i of elem.attributes) {
            if (i.attribute == "id" && i.value == id) {
              return true;
            }
          }
        })
      );
    },
    /**
     * Finds all elements with the desired class name
     * @param {String} className The class name your looking for
     * @returns all elements with the desired class
     */
    getElementsByClassName: (className) => {
      let elements = query(
        elementList,
        (elem) => {
          if (!elem.attributes) return;
          for (let i of elem.attributes) {
            if (i.attribute == "class" && i.value == className) {
              return true;
            }
          }
        },
        true
      );
      for (let i in elements) {
        elements[i] = Element(elements[i]);
      }

      return elements;
    },
    /**
     * The body element
     */
    body: "_",
    /**
     * Creates a html node
     * @param {String} tag The html tag
     * @returns An element with the html tag mentioned
     */
    createElement: (tag) => {
      return Element({ type: "html", tag, innerHTML: [], attributes: [] });
    },
    /**
     * Creates a text node
     * @param {String} text The text
     * @returns An a tag with the desired text inside
     */
    createTextNode: (text) => {
      return Element({
        type: "html",
        tag: "a",
        innerHTML: [{ type: "text", text }],
        attributes: [],
      });
    },
    documentElement: "_",

    elementList,
  });

  wo.watcher.addListener((event) => {
    if (event.operation == "get") {
      event.target[event.key] = Element(
        query(event.target.elementList, (elem) => {
          if (elem.type == "html" && elem.tag == "body") {
            return true;
          }
        })
      );
    }
  }, "body");

  wo.watcher.addListener((event) => {
    if (event.operation == "get") {
      event.target[event.key] = Element(
        query(event.target.elementList, (elem) => {
          if (elem.type == "html" && elem.tag == "html") {
            return true;
          }
        })
      );
    }
  }, "documentElement");

  return wo;
};

/**
 * Recursively queries through a html list
 * @param {Array} list The html element list your querying
 * @callback Boolean A callback that should return true if the elements matches the query
 * @param {Boolean} all All elements or just one
 * @returns An Element or multiple Elements (depending on the all param)
 */
export const query = (list, callback, all = false) => {
  let result = [];
  for (let i in list) {
    if (callback(list[i], i, list)) {
      if (!all) return list[i];
      else result.push(list[i]);
    }
    if (list[i].innerHTML && list[i].innerHTML.length > 0) {
      const res = query(list[i].innerHTML, callback, all);
      if (res) {
        if (!all) return res;
        else result = result.concat(res);
      }
    }
  }
  if (all) return result;
  return false;
};

/**
 * Simulates a js dom element
 * @param {Object} element A single Element returned by parse
 * @returns A watcher (proxtx/watcher) with some methods and attributes of the jsDom element
 */
export const Element = (element) => {
  let wo = watcher({
    style: {},
    element,
    innerHTML: "_",
    innerText: "_",
    /**
     * Appends a child element
     * @param {Element} child the child element
     */
    appendChild: (child) => {
      element.innerHTML
        ? element.innerHTML.push(child.element)
        : (element.innerHTML = [child.element]);
    },
    /**
     * Sets an attribute of the element
     * @param {String} attribute the attribute name
     * @param {String} value The attribute value
     */
    setAttribute: (attribute, value) => {
      for (let i in element.attributes) {
        if (element.attributes[i].attribute == attribute)
          element.attributes.splice(i, 1);
      }
      element.attributes.push({ attribute, value });
    },
    /**
     * Finds the attribute and returns it's value
     * @param {String} attribute The attribute you want the value of
     * @returns The attribute value
     */
    getAttribute: (attribute) => {
      for (let i of element.attributes)
        if (i.attribute == attribute) return i.value;
    },
    /**
     * Checks if an attribute exists
     * @param {String} attribute The attribute
     * @returns {Boolean}
     */
    hasAttribute: (attribute) => {
      for (let i of element.attributes)
        if (i.attribute == attribute) return true;
      return false;
    },
    /**
     * Removes a child element
     * @param {Element} elem The chid element
     * @returns {Boolean}
     */
    removeChild: (elem) => {
      if (!element.innerHTML) return;
      for (let i in element.innerHTML) {
        elem.element;
        // WTF if I don't write this ^^ this check returns false even tho it should return true which is really really weird.... I worked with proxy objects here but there is no trap for element
        if (elem.element == element.innerHTML[i]) {
          let e = element.innerHTML[i];
          element.innerHTML.splice(i, 1);
          return e;
        }
      }
    },
  });

  wo.watcher.addListener((event) => {
    if (event.operation == "set") {
      event.target.element.innerHTML = parse(event.value);
    }
    if (event.operation == "get") {
      event.target[event.key] = stringify(event.target.element.innerHTML);
    }
  }, "innerHTML");

  wo.watcher.addListener((event) => {
    if (event.operation == "set") {
      event.target.element.innerHTML = [{ type: "text", text: event.value }];
    }
    if (event.operation == "get") {
      if (!event.target.innerHTML) return "";
      let resText = "";
      query(
        event.target.element.innerHTML,
        (elem) => {
          elem.type == "text" && (resText += elem.text);
        },
        true
      );
      event.target[event.key] = resText;
    }
  }, "innerText");

  wo.watcher.addListener((event) => {
    let element = event.target.element;
    if (!event.nested) return;
    event = event.event;
    if (event.operation == "set") {
      if (!element.attributes) element.attributes = [];
      let entry;
      for (let i of element.attributes) {
        if (i.attribute == "style") {
          entry = i;
          break;
        }
      }
      if (!entry) {
        entry = { attribute: "style", value: "" };
        element.attributes.push(entry);
      }
      entry.value += `${keyToStyleAttribute(event.key)}: ${event.value};`;
    } else if (event.operation == "get") {
      if (!event.nested) return;
      event = event.event;
      if (!element.attributes) {
        event.target[value] = undefined;
        return;
      }
      let entry;
      for (let i of element.attributes) {
        if (i.attribute == "style") {
          entry = i;
          break;
        }
      }
      let styleSplit = entry.value.split(":");
      let result = {};
      for (let i = 0; i < styleSplit.length; i += 2) {
        result[styleSplit[i].split(" ")[0]] = styleSplit[i + 1].split(";")[0];
      }
      event.target[value] = result[styleAttributeToKey(event.key)];
    }
  }, "style");

  wo.watcher.addListener((event) => {
    if (event.operation == "get") {
      let children = [];
      for (let i of event.target.element.innerHTML) {
        if (i.type == "html") children.push(Element(i));
      }
      event.target[event.key] = children;
    }
  }, "children");

  return wo;
};

/**
 * Transforms js key to css rule name
 * @param {String} key The js key
 * @returns the css rule name
 */
export const keyToStyleAttribute = (key) => {
  let result = "";
  for (let i of key)
    if (i == i.toUpperCase()) result += "-" + i.toLowerCase();
    else result += i;
  return result;
};

/**
 * transforms css rule name into js key
 * @param {String} attribute the css rule name
 * @returns js key
 */
export const styleAttributeToKey = (attribute) => {
  let result = "";
  for (let i = 0; i < attribute.length; i++)
    if (i != "-") result += attribute[++i].toUpperCase();
    else result += attribute[i];
  return result;
};
