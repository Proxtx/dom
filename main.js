import { watcher } from "@proxtx/watcher";
import { stringify } from "@proxtx/html/string.js";
import { parse } from "@proxtx/html";

export const Dom = (elementList) => {
  let wo = watcher({
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
    body: "_",
    createElement: (tag) => {
      return Element({ type: "html", tag, innerHTML: [], attributes: [] });
    },
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

export const Element = (element) => {
  let wo = watcher({
    style: {},
    element,
    innerHTML: "_",
    innerText: "_",
    appendChild: (child) => {
      element.innerHTML
        ? element.innerHTML.push(child.element)
        : (element.innerHTML = [child.element]);
    },
    setAttribute: (attribute, value) => {
      for (let i in element.attributes) {
        if (element.attributes[i].attribute == attribute)
          element.attributes.splice(i, 1);
      }
      element.attributes.push({ attribute, value });
    },
    getAttribute: (attribute) => {
      for (let i of element.attributes)
        if (i.attribute == attribute) return i.value;
    },
    hasAttribute: (attribute) => {
      for (let i of element.attributes)
        if (i.attribute == attribute) return true;
      return false;
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

export const keyToStyleAttribute = (key) => {
  let result = "";
  for (let i of key)
    if (i == i.toUpperCase()) result += "-" + i.toLowerCase();
    else result += i;
  return result;
};

export const styleAttributeToKey = (attribute) => {
  let result = "";
  for (let i = 0; i < attribute.length; i++)
    if (i != "-") result += attribute[++i].toUpperCase();
    else result += attribute[i];
};
