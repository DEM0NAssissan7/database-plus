// ==UserScript==
// @name         Database+
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A nice upgrade to the Peace Database
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
    function round(number, accuracy) {
        if(accuracy) return Math.round(number * Math.pow(10, accuracy)) / Math.pow(10, accuracy)
        return Math.round(number * 100) / 100;
    }
    function get_elements(name) {
        return document.getElementsByClassName(name)
    }
    function create_element(tag_name) {
        return document.createElement(tag_name);
    }
    function get_letter_grade(grade) {
        let result = "F";
        function test(min_value, letter) {
            if(grade >= min_value) result = letter;
        }
        test(59, "F");
        test(60, "D");
        test(65, "D+");
        test(70, "C");
        test(75, "C+");
        test(80, "B");
        test(85, "B+");
        test(90, "A");
        test(95, "A+");
        test(101, "A++");
        return result;
    }
    function get_gpa_point(letter) {
        let result = 0;
        function test(value, _letter) {
            if(letter === _letter) result = value;
        }
        test(0, "F");
        test(1, "D");
        test(1, "D+");
        test(2, "C");
        test(2, "C+");
        test(3, "B");
        test(3, "B+");
        test(4, "A");
        test(4, "A+");
        test(4, "A++");
        return result;
    }

    // Page type
    function get_page_type() {

        if(get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(2)"))
            return "student"
        if(get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child(2)"))
            return "class"
        if(get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(1)"))
            return "menu"
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
            let grade = parseFloat(element.childNodes[6].innerText);
            result += grade;
            element.childNodes[5].textContent = get_letter_grade(grade);
            i++;
        }
        result = result / i;
        return result;
    }
    function get_gpa() {
        let result = 0;
        let element;
        let i = 0;
        while (true) {
            element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child("+ (i + 2) + ")");
            if(element === null) break;
            let grade = get_gpa_point(element.childNodes[5].innerText);
            result += grade;
            i++;
        }
        result = result / i;
        return result;
        
    }
    function get_real_gpa() {
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
        dom_element = create_element("div");
        dom_element.id = "dbp";
        const text = document.createTextNode("Database+");
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
        // Fonts
        document.body.style.fontFamily = "'Raleway', Helvetica, sans-serif"
        document.body.style.fontSize = "14px"
        // Get rid of useless elements
        get_elements("middle")[0].remove();
        get_elements("footer")[0].remove();
        // Recolor header
        get_elements("header")[0].style.background = "black";
        // Rename header
        get_elements("header")[0].textContent = "Database+"
        get_elements("header")[0].borderRadius = "10px"
        // Change site title
        document.title = "Peace Database+"
        // Set site icon
        {
            var link = get_path("link[rel~='icon']");
            if (!link) {
                link = create_element('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = "https://static.toiimg.com/thumb/msid-51767839,imgsize-17046,width-400,resizemode-4/51767839.jpg";
        }
    }
    function student_theme() {
        let element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(1)");
        element.style.background = "black";
        element.style.color = "white";
    }
    function class_theme() {
        let element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child(1)");
        element.style.background = "rgba(0,0,0,0.8)";
        element.style.backdropFilter = "blur(2px)"
        element.style.color = "white";
    }
    apply_styling();

    // Main program handler
    function program_handler() {
        let page_type = get_page_type();

        let grade, gpa, real_gpa;
        switch(page_type) {
            case "student":
                student_theme();
                grade = round(get_student_grade(), 1);
                gpa = round(get_gpa());
                real_gpa = round(get_real_gpa());
                change_dom_text("[" + get_letter_grade(grade) + "] GPA: " + gpa + " | (" + grade + "%, " + real_gpa + ")");
                break;
            case "class":
                class_theme();
                grade = round(get_class_grade(), 1);
                change_dom_text("[" + get_letter_grade(grade) + "] " + grade + "%");
                break;
            case "menu":
                student_theme();
                break;
        }
    }

    // Add event listener to recalculate grades when a key gets pressed down
    document.addEventListener('keydown', () => {setTimeout(program_handler, 50)});

    // Run initial program
    program_handler();
})();