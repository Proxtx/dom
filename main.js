import { watcher } from "@proxtx/watcher";
import { stringify } from "@proxtx/html/string.js";
import { parse } from "@proxtx/html";

export class Dom {
  constructor(html) {
    this.html = html;
  }
}

/*export class Element {
  constructor(element) {
    this = watcher(this);
    this.element = element;
  }
}*/

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
      event.target[event.key] =
        event.target.element.innerHTML &&
        event.target.element.innerHTML.length > 0 &&
        event.target.element.innerHTML[0].type == "text"
          ? event.target.element.innerHTML[0].text
          : "";
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

let doIt = true;

const keyToStyleAttribute = (key) => {
  let result = "";
  for (let i of key)
    if (i == i.toUpperCase()) result += "-" + i.toLowerCase();
    else result += i;
  return result;
};

const styleAttributeToKey = (attribute) => {
  let result = "";
  for (let i = 0; i < attribute.length; i++)
    if (i != "-") result += attribute[++i].toUpperCase();
    else result += attribute[i];
};
