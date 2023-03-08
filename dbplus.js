// ==UserScript==
// @name         Database Plus
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A nice upgrade to the peace database
// @author       Abdurahman Elmawi
// @match        http://peaceacademy.net/*
// @icon         https://static.toiimg.com/thumb/msid-51767839,imgsize-17046,width-400,resizemode-4/51767839.jpg
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // General function
    function get_path(path) {
        return document.querySelector(path);
    }
    function round(number) {
        return Math.round(number * 100) / 100;
    }
    function get_elements(name) {
        return document.getElementsByClassName(name)
    }



    // Page type
    function get_page_type() {
        if(get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(2)"))
            return "student"
        if(get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child(2)"))
            return "class"
        return "none"
    }

    // Student grades
    function get_student_grade() {
        let result = 0;
        let element;
        let i = 0;
        while (true) {
            element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child("+ (i + 2) + ")");
            if(element === null) break;
            element.childNodes[6].contentEditable=true; // Set to editable
            result += parseFloat(element.childNodes[6].innerText);
            i++;
        }
        result = result / i;
        return result;
    }
    function get_gpa() {
        return get_student_grade() / 25;
    }

    // Class grades
    function get_class_grade() {
        let result = 0;
        let weight_sum = 0;
        let element;
        let i = 0;
        while (true) {
            element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child("+ (i + 2) + ")");
            if(element === null) break;
            let nodes = element.childNodes;
            let numerator = parseFloat(nodes[5].innerText);
            nodes[5].contentEditable=true; // Set to editable
            if(!numerator) numerator = 0;
            let denominator = parseFloat(nodes[7].innerText);
            let weight = parseFloat(nodes[6].innerText);

            result += numerator / denominator * weight;
            weight_sum += weight;
            i++
        }
        result = result / weight_sum;
        return result * 100;
    }

    // Program DOM element
    let dom_element;
    function add_dom_element() {
        dom_element = document.createElement("dbp");
        dom_element.id = "dbp";
        const text = document.createTextNode("Database Plus");
        dom_element.appendChild(text);
        document.body.appendChild(dom_element);

        // Change style
        dom_element.style.fontSize = "48px";
    }
    function change_dom_text(text) {
        dom_element.childNodes[0].textContent = text;
    }
    add_dom_element();

    // Styling
    function apply_styling() {
        // Background
        document.body.style.background = "gray";
        // Get rid of middle bar
        get_elements("middle")[0].remove();
    }
    apply_styling();

    // Main program handler
    function program_handler() {
        let page_type = get_page_type();

        let grade, gpa;
        switch(page_type) {
            case "student":
                gpa = round(get_gpa());
                grade = round(get_student_grade());
                change_dom_text("GPA: " + gpa + " (" + grade + "%)");
                break;
            case "class":
                grade = round(get_class_grade());
                change_dom_text(grade + "%");
                break;
        }
    }

    // Add event listener to recalculate grades when a key gets pressed down
    document.addEventListener('keydown', () => {setTimeout(program_handler, 100)});

    // Run initial program
    program_handler();
})();