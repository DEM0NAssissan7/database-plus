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

/* TODO:

- Sort by most hurtful grades/classes
- Be able to add assignments/classes
- Identify each assignment type and its grade

*/

(function() {
    'use strict';

    // Options
    const apply_theming = false;

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
    function safe_run(handler) {
        try {
            handler();
        } catch (e) {}
    }
    function get_num(string) {
        let parse_float = parseFloat(string);
        if(parse_float) return parse_float;
        return 0;
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
            if(apply_theming) {
                element.style.color = "black"
                element.childNodes[6].style.color="#555555"
            }
            element.childNodes[6].contentEditable=true; // Set to editable
            let grade = get_num(element.childNodes[6].innerText);
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
            let numerator = get_num(nodes[5].innerText);
            nodes[5].contentEditable=true; // Set to editable
            if(apply_theming) {
                nodes[5].style.color = "#555555";
                element.style.color = "black"
            }
            if(!numerator) numerator = 0;
            let denominator = get_num(nodes[7].innerText);
            let weight = get_num(nodes[6].innerText);

            if(denominator){
                result += numerator / denominator * weight;
                weight_sum += weight;
            }
            i++
        }
        result = result / weight_sum;
        return result * 100;
    }

    // Append class
    let clone;
    let clones = 0;
    safe_run(() => {
        let element = document.getElementById("ContentPlaceHolder1_GridView1").lastChild;
        clone = element.childNodes[2].cloneNode(true);
    });
    function append_class() {
        clones++;
        let element = document.getElementById("ContentPlaceHolder1_GridView1").lastChild;
        let node = clone.cloneNode(true);
        if(!node) return;
        node.childNodes[1].textContent = "";
        node.childNodes[2].textContent = "Class " + clones;
        node.childNodes[2].contentEditable = true;
        node.childNodes[3].textContent = "Nobody";
        node.childNodes[3].contentEditable = true;
        node.childNodes[5].textContent = "F";
        node.childNodes[6].textContent = "0.00";
        add_remove_button(node);
        element.appendChild(node);
        program_handler();
    }
    function add_class_append_button() {
        let button = create_element("button");
        button.textContent = "Add Class";
        button.id = "button";
        button.type="button"
        button.onclick = append_class;
        get_path("#form2 > div:nth-child(3) > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > div").appendChild(button);
    }
    safe_run(add_class_append_button)

    // Append assignment
    safe_run(() => {
        let element = document.getElementById("ContentPlaceHolder1_GridView2").childNodes[1];
        clone = element.childNodes[2].cloneNode(true);
    });
    function append_assignment() {
        clones++;
        let element = document.getElementById("ContentPlaceHolder1_GridView2").childNodes[1];
        let node = clone.cloneNode(true);
        if(!node) return;
        node.childNodes[1].textContent = "";
        node.childNodes[2].textContent = "";
        node.childNodes[3].textContent = "Assignment";
        node.childNodes[4].textContent = "Assignment " + clones;
        node.childNodes[4].contentEditable = true;
        node.childNodes[5].textContent = "0";
        node.childNodes[5].contentEditable = true;
        node.childNodes[6].textContent = "5.00 %";
        node.childNodes[6].contentEditable = true;
        node.childNodes[7].textContent = "100";
        node.childNodes[7].contentEditable = true;
        add_remove_button(node);
        element.appendChild(node);
        program_handler();
    }
    function add_assignment_append_button() {
        let button = create_element("button");
        button.textContent = "Add Assignment";
        button.id = "button";
        button.type = "button"
        button.onclick = append_assignment;
        document.getElementById("ContentPlaceHolder1_GridView2").appendChild(button);
    }
    safe_run(add_assignment_append_button);

    // Remove class
    let buttons = 0;
    function add_remove_button(node) {
        let button = create_element("button");
        button.textContent = "-";
        button.id = "button" + buttons;
        button.type = "button"
        function delete_row() {
            node.remove();
            program_handler();
        }
        button.onclick = delete_row;
        node.appendChild(button);
        buttons++;
    }
    function add_all_remove_class_buttons() {
        let nodes = document.getElementById("ContentPlaceHolder1_GridView1").lastChild.childNodes;
        for(let i = 1; i < nodes.length - 1; i++)
            add_remove_button(nodes[i]);
    }
    function add_all_remove_assignment_buttons() {
        let nodes = document.getElementById("ContentPlaceHolder1_GridView2").childNodes[1].childNodes;
        for(let i = 1; i < nodes.length - 1; i++)
            add_remove_button(nodes[i]);
    }
    safe_run(add_all_remove_class_buttons);
    safe_run(add_all_remove_assignment_buttons);

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
        // Set site background
        document.body.style.background = "white"
        // Remove border around inner part
        safe_run(() => {get_path("#form2 > div:nth-child(3) > table > tbody > tr:nth-child(2) > td").style.borderWidth = "0px";})
        // Make border around window bigger
        safe_run(() => {get_path("#form2 > div:nth-child(3) > table").style.borderWidth = "3px";})
        safe_run(() => {get_path("#form2 > div:nth-child(3) > table").style.borderCollapse = "collapse";})
    }
    function student_theme() {
        let element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(1)");
        element.style.background = "black";
        element.style.color = "white";
    }
    function class_theme() {
        let element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child(1)");
        element.style.background = "black";
        element.style.color = "white";
    }
    if(apply_theming) apply_styling();

    // Main program handler
    function program_handler() {
        let page_type = get_page_type();

        let grade, gpa, real_gpa;
        switch(page_type) {
            case "student":
                if(apply_theming) student_theme();
                grade = round(get_student_grade(), 1);
                gpa = round(get_gpa());
                real_gpa = round(get_real_gpa());
                change_dom_text("[" + get_letter_grade(grade) + "] GPA: " + gpa + " | (" + grade + "%, " + real_gpa + ")");
                break;
            case "class":
                if(apply_theming) class_theme();
                grade = round(get_class_grade(), 1);
                change_dom_text("[" + get_letter_grade(grade) + "] " + grade + "%");
                break;
            case "menu":
                if(apply_theming) student_theme();
                break;
        }
    }

    // Add event listener to recalculate grades when a key gets pressed down
    document.addEventListener('keydown', () => {setTimeout(program_handler, 50)});

    // Run initial program
    program_handler();
})();