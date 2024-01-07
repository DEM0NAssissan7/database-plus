// ==UserScript==
// @name         Database+
// @namespace    http://tampermonkey.net/
// @version      1.7.1
// @description  A nice upgrade to the Peace Database
// @author       Abdurahman Elmawi
// @match        http://peaceacademy.net/*
// @icon         https://static.toiimg.com/thumb/msid-51767839,imgsize-17046,width-400,resizemode-4/51767839.jpg
// @grant        none
// ==/UserScript==

/* TODO:

- Add alternative view button to allow viewing all quarters in one nice screen
- Add feature to display cumilative semester grade and be able to see what grades are required for a certain GPA

I consider this program stable now.

*/

(function() {
    'use strict';

    // Options
    const apply_theming = true;

    // General functions
    function get_path(path) {
        return document.querySelector(path);
    }
    function round(number, accuracy) {
        if(accuracy || accuracy === 0) return Math.round(number * Math.pow(10, accuracy)) / Math.pow(10, accuracy)
        return Math.round(number * 100) / 100;
    }
    function get_elements(name) {
        return document.getElementsByClassName(name)
    }
    function element_by_id(id){
        return document.getElementById(id);
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
    function get_cookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
    function reload_page() {
        window.location.reload(true);
    }

    // Quarter memory
    let quarters = [];
    function get_quarter() {
        const element = get_path("#ContentPlaceHolder1_DropDownList1");
        if(!element) return parseInt(get_cookie("quarter"));
        let selection_text = element.selectedOptions.item(0).textContent;
        switch(selection_text) {
            case "1st Quarter":
                return 1;
            case "2nd Quarter":
                return 2;
            case "Mid Term":
                return 3;
            case "3rd Quarter":
                return 4;
            case "4th Quarter":
                return 5;
            case "2nd Term":
                return 6;
        }
    }
    function store_quarter(quarter) {
        document.cookie = "quarter=" + quarter;
        return quarter;
    }
    function track_quarter() {
        let grades = [];
        let i = 0;
        while (true) {
            const element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child("+ (i + 2) + ")");
            if(element === null) break;
            let grade = parseInt(element.childNodes[6].innerText);
            let name = element.childNodes[2].innerText;

            grades.push({
                grade: grade,
                class_name: name
            })

            i++;
        }
        if(i !== 0) quarters[get_quarter()] = grades;
    }
    function export_quarters() {
        let string = "";
        for(let i = 0; i < quarters.length; i++) {
            let quarter = quarters[i];
            if(!quarter) continue;
            let _string = "!" + i + ":";
            for(let entry of quarter) {
                _string += entry.class_name + "|" + entry.grade + ","
            }
            string += _string;
        }
        document.cookie = "quarters=" + string + "!";
    }
    function import_quarters() {
        let string = get_cookie("quarters");
        if(!string) return;
        let token = "";
        let quarter = [];
        let name = "";
        let index = null;
        for(let char of string) {
            if(char === "!") {
                if(name.length > 0 && index)
                    quarters[index] = quarter;
                quarter = [];
                token = "";
                continue;
            }
            if(char === ":") {
                index = parseInt(token);
                token = "";
                continue;
            }
            if(char === "|") {
                name = token;
                token = "";
                continue;
            }
            if(char === ",") {
                if(name.length < 1) console.error("Name is blank");
                quarter.push({
                    grade: parseInt(token),
                    class_name: name
                });
                token = "";
                continue;
            }
            token += char;
        }
    }
    import_quarters();
    safe_run(track_quarter);
    export_quarters();
    console.log("Current quarter is " + store_quarter(get_quarter()));

    // Semester calculations
    let semesters = [[],[]];
    function group_semsters() {
        for(let i = 0; i < quarters.length; i++) {
            let quarter = quarters[i];
            if(!quarter) continue;
            let sem = 0;
            if(i > 3) sem = 1;
            for(let entry of quarter) {
                let success = false;
                for(let _quarter of semesters[sem]) {
                    if(_quarter[0] === entry.class_name) {
                        _quarter.push(entry.grade);
                        success = true;
                    }
                }
                if(!success) semesters[sem].push([entry.class_name, entry.grade]);
            }
        }
    }
    group_semsters();
    console.log(semesters, quarters);

    // Alternative display
    const final_weight = 10;
    const padding = "6px";
    const background = "white";
    const text_color = "black";
    let display;
    let tables = [];
    let table_labels = [];
    let table_append_buttons = [];
    function override_page_view() {
        document.head.hidden = true;
        document.body.hidden = true;
    }
    function create_display() {
        // Create display
        console.log("Creating display");
        const root = get_path("html");

        display = root.appendChild(create_element("display"));
        display.style.position = "absolute";
        display.style.top = "0px";
        display.style.left = "0px";
        
        display.style.margin = "auto"
        display.style.width = "100%";
        display.style.height = "auto";
        display.style.textAlign = "center";

        display.style.fontFamily = "system-ui";
        display.style.background = background;
        display.style.color = text_color;
    }
    function create_table() {
        const table = create_element("table");
        table.id = "d_table";

        table.style.margin = "auto";
        table.style.paddingTop = "30px";
        table.style.top = "center";
        table.style.left = "center";

        return table;
    }
    function create_class_entry(class_name, grades, name_editable) {
        const container = create_element("tr");
        function entry(text) {
            const td = create_element("td");
            td.textContent = text;
            td.style.padding = padding;
            container.appendChild(td);
            return td;
        }

        entry(class_name).contentEditable = name_editable ?? false;
        for(let i = 0; i < 3; i++)
            entry(grades[i]).contentEditable = true;

        entry(get_letter_grade(0)).style.fontWeight = "bold";
        entry(0);
        entry(0.5).contentEditable = true;


        const button = create_element("button");
        button.textContent = "-";
        button.type = "button";
        button.onclick = () => {container.remove()};
        container.appendChild(button);

        return container;
    }
    function label_sem1() {
        const container = create_element("tr");
        function entry(text) {
            const td = create_element("td");
            td.innerText = text;
            td.style.padding = padding;
            container.appendChild(td);
            return td;
        }
        entry("Class");

        entry("1st");
        entry("2nd");
        entry("Midterm");
        entry("Semester 1");
        entry("%");
        entry("Credits");

        return container;
    }
    function label_sem2() {
        const container = create_element("tr");
        function entry(text) {
            const td = create_element("td");
            td.innerText = text;
            td.style.padding = padding;
            container.appendChild(td);
            return td;
        }
        entry("Class");

        entry("3rd");
        entry("4th");
        entry("Final");
        entry("Semester 2");
        entry("%");
        entry("Credits");

        return container;
    }
    function style_tables() {
        for(let table of tables) {
            let table_entries = table.childNodes;
            for(let element of table_entries) {
                // Theme each row
                element.style.outlineColor = "black";
                element.style.outlineStyle = "outset";
                for(let _element of element.childNodes) {
                    // Theme each entry
                    if(!_element.value) {
                        _element.style.outlineColor = "gray";
                        _element.style.outlineStyle = "groove";
                        _element.style.outlineWidth = "thin";
                        // _element.style.textAlign = "center";
                    }
                }
            }
        }
    }
    function create_table_label() {
        const label = create_element("p");
        const text = document.createTextNode("Database+");
        label.appendChild(text);
        label.style.fontSize = "48px";
        label.style.fontWeight = "Bold";
        label.style.width = "0%";
        label.style.margin = "auto";
        return label;
    }
    function create_table_append_button(table) {
        const button = create_element("button");
        button.textContent = "Add Class";
        button.id = "button";
        button.type = "button";
        button.onclick = () => {
            table.appendChild(create_class_entry("Class", [], true));
            style_tables();
        };
        button.style.margin = "auto";
        return button;
    }
    function calc_final_grades() {
        let cumilative_gpa = 0;
        let cumilative_credits = 0;
        for(let i = 0; i < tables.length; i++) {
            let table = tables[i];
            let letter_grades = [];
            for(let j = 1; j < table.childNodes.length; j++) {
                let element = table.childNodes[j];
                const nodes = element.childNodes;
    
                let grades = [];
                grades.push(parseInt(nodes[1].innerText));
                grades.push(parseInt(nodes[2].innerText));
                grades.push(parseInt(nodes[3].innerText));
    
                let final_grade = 0;
                let weight;
                let weights = 0;
                for(let k = 0; k < grades.length; k++) {
                    let grade = grades[k];
                    if(!grade && grade !== 0) continue;

                    if(k < 2)
                        weight = (100 - final_weight) / 200;
                    else
                        weight = final_weight / 100;
        
                    weights += weight;
                    final_grade += grade * weight;
                }
                final_grade = final_grade / weights;
    
                const letter_grade = get_letter_grade(round(final_grade, 0));
                letter_grades.push([letter_grade, get_num(nodes[6].innerText)]);
                nodes[4].innerText = letter_grade;
                nodes[5].innerText = round(final_grade, 0);
            }
            let gpa = 0;
            let credits = 0;
            for(let letter_credit of letter_grades) {
                gpa += get_gpa_point(letter_credit[0]) * letter_credit[1];
                credits += letter_credit[1];
            }
            cumilative_gpa += gpa;
            cumilative_credits += credits;
            gpa = gpa / credits;
            table_labels[i].textContent = round(gpa, 2);
        }
        table_labels[2].innerText = round(cumilative_gpa / cumilative_credits, 2);
    }
    function activate_alternative_display() {
        console.log("Activating alternative display");

        override_page_view();
        create_display();

        // Add table entries
        tables = [create_table(),create_table()];
        tables[0].appendChild(label_sem1());
        tables[1].appendChild(label_sem2());

        for(let i = 0; i < tables.length; i++) {
            let table = tables[i];
            for(let _class of semesters[i]) {
                let grades = [];
                for(let j = 1; j < _class.length; j++)
                    grades.push(_class[j]);
                table.appendChild(create_class_entry(_class[0], grades));
            }
        }
        style_tables();

        // Add table labels
        table_labels = [create_table_label(), create_table_label(), create_table_label()];

        display.appendChild(tables[0]);
        display.appendChild(create_table_append_button(tables[0]));
        display.appendChild(table_labels[0]);
        display.appendChild(tables[1]);
        display.appendChild(create_table_append_button(tables[1]));
        display.appendChild(table_labels[1]);
        document.addEventListener('keydown', () => {setTimeout(calc_final_grades, 50)});
        document.addEventListener('mouseup', () => {setTimeout(calc_final_grades, 50)});
        calc_final_grades();

        display.appendChild(add_reset_button());
        create_alt_deactivation_button();

        display.appendChild(table_labels[2]);
    }
    function deactivate_alt_view() {
        display.remove();
        document.head.hidden = false;
        document.body.hidden = false;
    }
    function create_alternative_display_button() {
        const button = create_element("button");
        button.textContent = "Semester View";
        button.id = "altdisplay";
        button.type = "button";
        button.onclick = activate_alternative_display;
        document.body.appendChild(button);
    }
    function create_alt_deactivation_button() {
        const button = create_element("button");
        button.textContent = "Exit Semester View";
        button.id = "exitalt";
        button.type = "button";
        button.onclick = deactivate_alt_view;
        
        // button.style.position = "absolute";
        // button.style.top = "100%";
        display.appendChild(button);
    }

    // Page type
    function get_page_type() {
        if(get_path("#form2 > div:nth-child(4) > table > tbody > tr:nth-child(3) > td > center > table > tbody > tr:nth-child(1) > td:nth-child(3)"))
            return "menu"
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
            if(!element) break;
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

    // Assignment groups
    let assignment_groups = [];
    function add_assignment_group(name, percentage) {
        for(let group of assignment_groups) {
            if(group.name === name){
                group.percentage += percentage;
                group.count++;
                return;
            }
        }
        assignment_groups.push({
            name: name,
            percentage: percentage,
            assignment_percent: percentage,
            average: 0,
            sum: 0,
            count: 1
        });
    }
    function probe_assignment_groups() {
        let element;
        for(let i = 0;;i++) {
            element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child("+ (i + 2) + ")");
            if (element === null) break;
            let nodes = element.childNodes;
            add_assignment_group(nodes[3].innerText, get_num(nodes[6].innerText));
        }
        for(let group of assignment_groups)
            group.percentage = Math.round(group.percentage);
    }
    function get_assignment_group(node) {

        let name = node.childNodes[3].innerText;
        for(let group of assignment_groups)
            if(group.name === name) return group;
        // If the node is a drop-down
        name = node.childNodes[3].firstChild.selectedOptions[0].innerText;
        for(let group of assignment_groups)
            if(group.name === name) return group;
        return null;
    }
    function update_percentages() {
        let element, group;
        for(let i = 0;;i++) {
            element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child("+ (i + 2) + ")");
            if (element === null) break;
            group = get_assignment_group(element);
            if(group.count < 1) group.count = 1;
            element.childNodes[6].textContent = round(group.percentage / group.count) + " %";
        }
    }
    function add_assignment_group_button(node) {
        let nodes = node.childNodes;
        let select = create_element("select");
        select.for = "Category";
        for(let group of assignment_groups) {
            let option = create_element("option");
            option.textContent = group.name;
            option.value = group.percentage;
            select.appendChild(option)
        }
        let group = {count: 0};
        function change_percentage() {
            group.count--;
            group = get_assignment_group(node);
            nodes[6].textContent = select.value;
            group.count++;
            update_percentages();
        }
        setTimeout(change_percentage, 10);
        select.onchange = change_percentage;
        nodes[3].appendChild(select);
    }
    let group_summary = "";
    function update_group_summary() {
        group_summary = "";
        for(let group of assignment_groups) {
            let percentage = round(group.average / group.sum * 100);
            if(!percentage) percentage = "-";
            group_summary += group.name + ": " + group.percentage + "% (" + percentage + "%)\n";
            group.average = 0;
            group.sum = 0;
        }
    }
    safe_run(probe_assignment_groups);
    safe_run(update_percentages);

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

            let drop_checkbox = nodes[9].childNodes[0].childNodes[0];
            drop_checkbox.autocomplete = "off";
            drop_checkbox.disabled = null;
            let dropped = drop_checkbox.checked;

            let group = get_assignment_group(element);
            
            if(denominator && !dropped){
                result += numerator / denominator * weight;
                weight_sum += weight;

                // Group average
                group.average += numerator / denominator * weight;
                group.sum += weight;
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
        let element = element_by_id("ContentPlaceHolder1_GridView1").lastChild;
        clone = element.childNodes[2].cloneNode(true);
    });
    function append_class() {
        clones++;
        let element = element_by_id("ContentPlaceHolder1_GridView1").lastChild;
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
        button.type = "button";
        button.onclick = append_class;
        get_path("#form2 > div:nth-child(3) > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > div").appendChild(button);
    }
    safe_run(add_class_append_button)

    // Append assignment
    safe_run(() => {
        let element = element_by_id("ContentPlaceHolder1_GridView2").childNodes[1];
        clone = element.childNodes[2].cloneNode(true);
    });
    function append_assignment() {
        clones++;
        let element = element_by_id("ContentPlaceHolder1_GridView2").childNodes[1];
        let node = clone.cloneNode(true);
        if(!node) return;
        node.childNodes[1].textContent = "";
        node.childNodes[2].textContent = "";
        node.childNodes[3].textContent = "";
        node.childNodes[4].textContent = "Assignment " + clones;
        node.childNodes[4].contentEditable = true;
        node.childNodes[5].textContent = "0";
        node.childNodes[5].contentEditable = true;
        node.childNodes[6].textContent = "0.00 %";
        node.childNodes[7].textContent = "100";
        node.childNodes[7].contentEditable = true;
        add_remove_button(node);
        add_assignment_group_button(node);
        element.appendChild(node);
        program_handler();
    }
    function add_assignment_append_button() {
        let button = create_element("button");
        button.textContent = "Add Assignment";
        button.id = "button";
        button.type = "button"
        button.onclick = append_assignment;
        button.style.padding = "10px";
        button.style.width = "max-content"
        element_by_id("ContentPlaceHolder1_GridView2").appendChild(button);
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
            safe_run(() => {
                get_assignment_group(node).count--;
                update_percentages();
            });
            node.remove();
            program_handler();
        }
        button.onclick = delete_row;
        node.appendChild(button);
        buttons++;
    }
    function add_all_remove_class_buttons() {
        let nodes = element_by_id("ContentPlaceHolder1_GridView1").lastChild.childNodes;
        for(let i = 1; i < nodes.length - 1; i++)
            add_remove_button(nodes[i]);
    }
    function add_all_remove_assignment_buttons() {
        let nodes = element_by_id("ContentPlaceHolder1_GridView2").childNodes[1].childNodes;
        for(let i = 1; i < nodes.length - 1; i++)
            add_remove_button(nodes[i]);
    }
    safe_run(add_all_remove_class_buttons);
    safe_run(add_all_remove_assignment_buttons);

    // Sort assignments
    let sorting_algorithm = "offensive";
    function sort_assignments() {
        let element_cache = [];
        let element;
        let i = 0;
        let class_grade = get_class_grade() / 100;
        while (true) {
            element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child("+ (i + 2) + ")");
            if(element === null) break;
            let nodes = element.childNodes;

            let numerator = get_num(nodes[5].innerText);
            if(!numerator) numerator = 0;

            let denominator = get_num(nodes[7].innerText);
            let weight = get_num(nodes[6].innerText);

            let assignment_grade = numerator / denominator;

            let offensiveness = (class_grade - assignment_grade) * weight;
            if(offensiveness === 0) offensiveness = -0.01 * weight
            element_cache.push([element,
                                weight / denominator,
                                offensiveness,
                                Math.abs(class_grade - assignment_grade),
                                -assignment_grade,
                                weight]);
            element.remove();
        }
        // Sort elements by a certain algorithm
        switch (sorting_algorithm) {
            case "influence": // Most influencial per point
                element_cache = element_cache.sort((a, b) => b[1] - a[1]);
                break;
            case "offensive": // Most hurful grade to score
                element_cache = element_cache.sort((a, b) => b[2] - a[2]);
                break;
            case "outliars": // Most deviant from average
                element_cache = element_cache.sort((a, b) => b[3] - a[3]);
                break;
            case "grade": // Sort by assignment grade
                element_cache = element_cache.sort((a, b) => b[4] - a[4]);
                break;
            case "type": // Sort by group
                element_cache = element_cache.sort((a, b) => b[5] - a[5]);
                break;
        }
        let container = element_by_id("ContentPlaceHolder1_GridView2").childNodes[1];
        for(element of element_cache)
            container.appendChild(element[0]);
    }
    function add_sort_button() {
        let button = create_element("button");
        button.onclick = sort_assignments;
        button.textContent = "Sort";
        button.type="button";
        button.style.padding = "5px";
        element_by_id("ContentPlaceHolder1_GridView2").appendChild(button);
    }
    function add_sort_selection() {
        let pretext = create_element("div");
        pretext.textContent = "Sort by: ";
        pretext.style.padding = "12px"
        element_by_id("ContentPlaceHolder1_GridView2").appendChild(pretext);

        let select = create_element("select");
        select.for = "Category";
        function add_option(value, title) {
            let option = create_element("option");
            option.textContent = title;
            option.value = value;
            select.appendChild(option)
        }
        add_option("offensive", "offensiveness");
        add_option("grade", "score");
        add_option("influence", "per-point influence");
        add_option("type", "% of grade");
        add_option("outliars", "deviancy");
        function change_algorithm() {
            sorting_algorithm = select.value;
            sort_assignments();
        }
        select.onchange = change_algorithm;
        pretext.appendChild(select);
    }
    safe_run(add_sort_selection);
    safe_run(add_sort_button);

    // Program DOM element
    let dom_element, sub_element;
    function add_dom_elements() {
        dom_element = create_element("p");
        dom_element.id = "dbp";
        const text = document.createTextNode("Database+");
        dom_element.appendChild(text);
        document.body.appendChild(dom_element);

        sub_element = create_element("div");
        sub_element.id = "dbps";
        const subtitle = document.createTextNode("");
        sub_element.appendChild(subtitle);
        document.body.appendChild(sub_element);

        // Change style
        dom_element.style.fontSize = "48px";
        sub_element.style.fontSize = "24px";
        sub_element.style.whiteSpace = "pre-line"
    }
    function change_dom_text(text) {
        dom_element.childNodes[0].textContent = text;
    }
    function change_sub_text(text) {
        sub_element.childNodes[0].textContent = text;
    }
    add_dom_elements();

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

    // Refreshing
    function add_reset_button () {
        const button = create_element("button");
        button.onclick = () => {reload_page()};
        button.textContent = "Reset";
        button.style.alignSelf = "center"
        button.style.transform = "translateX(1000%)"
        return button;
    }
    safe_run(() => {element_by_id("ContentPlaceHolder1_GridView2").appendChild(add_reset_button)});

    // Main program handler
    let handler_lock = false;
    function program_handler() {
        if(!handler_lock) {
            let time = performance.now();
            let page_type = get_page_type();

            let grade, gpa, real_gpa;
            switch(page_type) {
                case "student":
                    if(apply_theming) student_theme();
                    grade = round(get_student_grade(), 0);
                    gpa = round(get_gpa());
                    real_gpa = round(get_real_gpa());
                    change_dom_text("[" + get_letter_grade(grade) + "] GPA: " + gpa + " | (" + grade + "%, " + real_gpa + ")");
                    break;
                case "class":
                    if(apply_theming) class_theme();
                    update_percentages();
                    grade = round(get_class_grade(), 0);
                    update_group_summary();
                    change_dom_text("[" + get_letter_grade(grade) + "] " + grade + "%");
                    change_sub_text(group_summary);
                    break;
                case "menu":
                    if(apply_theming) student_theme();
                    break;
            }
            if(performance.now() - time > 3000) {
                handler_lock = true
                console.warn("The program handler is too slow. Locking execution.");
            }
        }
    }

    // Add event listener to recalculate grades when a key gets pressed down
    document.addEventListener('keydown', () => {setTimeout(program_handler, 50)});
    document.addEventListener('mouseup', () => {setTimeout(program_handler, 50)});

    // Run initial program
    program_handler();
    create_alternative_display_button();
    // Initial sort
    safe_run(sort_assignments);
})();
