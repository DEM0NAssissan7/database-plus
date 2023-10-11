/* School grade database processing and display library

The goal of this project is to provide a standard where any school grade database can enjoy the features of database+.
This is for me when I go to college God willing, and the grades websites may suck, so I have to recode database+ for 
every website I want to use it.

Instead, this project will standardize all calculations, displays, features, and designs. All you would need to do to port it to
a new website is implement it and tell libdb what the grades/weights (and other things) are.

The end goal is to port peace academy db+ to this library in order for it to become monolithic and portable.

"Portability! Portability! Portability!" - Stoove Jeebs
*/

{
    // Constants
    const adjust_weights = true; // Change this depending on your grading structure
    const program_name = "libDB";
    const padding = "5px";
    const header_text_color = "#AA0000";
    const score_text_color = "#2760e3";

    // Basic Functions
    function create_element(name) {
        return document.createElement(name);
    }
    function safe_run(handler) {
        try {
            return handler();
        } catch (e) {
            console.error(e);
        }
    }

    // Math
    function round(number, accuracy) {
        if(accuracy || accuracy === 0) return Math.round(number * Math.pow(10, accuracy)) / Math.pow(10, accuracy)
        return Math.round(number * 100) / 100;
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

    /* Grade Engine */
    let grades = [];
    {
        let type = null;
        let average_grade = 0;
        let count = 0;
        let grade_sum = 0;
        let weight_sum = 0;
        function Class (name, percent_grade, view_handler) {
            this.class_name = name;
            this.grade = percent_grade;
            this.view_handler = view_handler;
            this.id = count;
        }
        function Assignment (name, date, category, percent_weight, score, max_score, dropped) {
            this.assignment_name = name;
            this.date = date;
            this.category = category;
            this.weight = percent_weight;
            this.score = score;
            this.max = max_score;
            this.id = count;
            this.drop = dropped;
        }
        function add_managed_class (name, percent_grade, view_handler) {
            let _class = new Class(name, percent_grade, view_handler);
            grades.push(_class);
            return _class;
        }
        function add_managed_assignment (name, date, category, percent_weight, score, max_score, dropped) {
            let assignment = new Assignment(name, date, category, percent_weight, score, max_score, dropped);
            grades.push(assignment);
            return assignment;
        }
        function get_avg_grade() {
            let sum = 0;
            switch(type) {
                case "assignment":
                    weight_sum = 0;
                    grade_sum = 0;
                    for(let grade of grades) {
                        if(grade.drop) continue;
                        grade_sum += (grade.score / grade.max) * grade.weight;
                        weight_sum += grade.weight;
                    }
                    average_grade = grade_sum / weight_sum * 100;
                    return average_grade;
                case "class":
                    for(let grade of grades)
                        sum += grade.grade;
                    average_grade = sum / grades.length;
                    return average_grade;
            }
            throw new Error("Type is invalid (" + type + ")");
        }
        function get_gpa() {
            if(type !== "class")
                throw new Error("Type is not of type 'class'");
            let sum = 0;
            for(let grade of grades)
                sum += get_gpa_point(get_letter_grade(grade.grade));
            return sum / grades.length;
        }
        function set_type(t) {
            if(t !== "assignment" && t !== "class")
                throw new Error("Type is invalid (" + type + ")");
            type = t;
        }
        function get_type() {
            return type;
        }
        function get_offensiveness(assignment) {
            return (grade_sum - (assignment.score / assignment.max_score * assignment.weight)) / (weight_sum - assignment.weight);
        }
    }

    /* Display engine */
    let display, table, average_grade_element;
    function override_page_view() {
        document.head.hidden = true;
        document.body.hidden = true;
    }
    function add_element(element) {
        return display.appendChild(element);
    }
    function create_table() {
        table = create_element("table");
        table.id = "d_table";

        table.style.margin = "auto";
        table.style.paddingTop = "30px";
        table.style.top = "center";
        table.style.left = "center";

        return table;
    }
    function init_display() {
        console.log("Creating display");
        let root = document.querySelector("html");

        display = root.appendChild(create_element("display"));
        display.style.position = "absolute";
        display.style.top = "0px";
        display.style.left = "0px";
        
        display.style.width = "-webkit-fill-available";
        display.style.height = "-webkit-fill-available";
    }
    function add_average_grade_element() {
        average_grade_element = add_element(create_element("p"));
        average_grade_element.id = "average_grade";
        
        const text = document.createTextNode(program_name);
        average_grade_element.appendChild(text);
        
        average_grade_element.style.fontSize = "48px";
        average_grade_element.style.textAlign = "center";
        average_grade_element.style.fontWeight = "bold";
    }
    function change_average_grade(value) {
        average_grade_element.childNodes[0].textContent = value;
    }

    // Table management
    function add_table_entry(element) {
        table.appendChild(element);
    }
    function clear_table() {
        table = create_table();
        document.getElementById("d_table").replaceWith(table);
    }
    function create_table_entry(fields) {
        let container = create_element("tr");
        function entry(text) {
            let td = create_element("td");
            td.innerText = text;
            td.style.padding = padding;
            container.appendChild(td);
            return td;
        }
        for(let field of fields)
            entry(field);
        return container;
    }
    function label_assignment(entries_enum) {
        clear_table();
        let entries = [];
        if(entries_enum.date) entries.push("Date");
        if(entries_enum.weight) entries.push("Weight");
        if(entries_enum.name) entries.push("Name");
        if(entries_enum.category) entries.push("Category");
        if(entries_enum.max && entries_enum.score) entries.push("% Score");
        if(entries_enum.score) entries.push("Score");
        if(entries_enum.max) entries.push("Max");
        entries.push("Drop");
        let table_entry = create_table_entry(entries);
        table_entry.style.fontWeight = "bold";
        table_entry.style.color = header_text_color;
        add_table_entry(table_entry);
    }
    function label_class() {
        clear_table();
        let table_entry = create_table_entry([  "",
                                                " Name ", 
                                                " % Grade ", 
                                                " Letter Grade "])
        table_entry.style.fontWeight = "bold";
        table_entry.style.color = header_text_color;
        add_table_entry(table_entry);
    }
    function create_assignment_entry(assignment_name, date, category, percent_weight, score, max_score, dropped, score_change_handler, drop_handler) {
        let container = create_element("tr");
        function entry(text) {
            let td = create_element("td");
            td.innerText = text;
            td.style.padding = padding;
            container.appendChild(td);
            return td;
        }
        if(date) entry(date); // Date
        if(percent_weight !== null) entry(round(percent_weight)); // Weight
        if(assignment_name) entry(assignment_name); // Name
        if(category) entry(category); // Category

        let percent_element = entry(round(score/max_score * 100, 0)); // 
        percent_element.style.color = "green";
        percent_element.style.fontWeight = "bold";

        let score_element = create_element("input"); // Score
        score_element.type = "text";
        score_element.value = score;
        score_element.contentEditable=true;
        score_element.style.color = score_text_color;
        score_element.style.fontWeight = "bold";
        score_element.style.width = "6ch";
        score_element.style.outline = "none";
        score_element.style.borderWidth = "0px";
        score_element.onchange = () => {
            score_change_handler(get_num(score_element.value));
        };
        score_element.style.padding = padding;
        container.appendChild(score_element);
        
        entry(max_score); // Max

        // Add drop checkbox
        let input = create_element("input");
        input.type = "checkbox";
        input.checked = dropped;
        input.onchange = () => {
            drop_handler(input.checked);
        }
        container.appendChild(input);

        return container;
    }
    function create_class_entry(class_name, percentage_grade, view_handler, score_change_handler) {
        let container = create_element("tr");
        function entry(text) {
            let td = create_element("td");
            td.innerText = text;
            td.style.padding = padding;
            container.appendChild(td);
            return td;
        }
        let button = create_element("button");
        button.onclick = view_handler;
        button.innerText = "View";

        container.appendChild(button);
        entry(class_name);
        let grade_element = create_element("input"); // Score
        grade_element.type = "text";
        grade_element.value = percentage_grade;
        grade_element.contentEditable=true;

        grade_element.style.color = score_text_color;
        grade_element.style.fontWeight = "bold"
        grade_element.style.width = "6ch";
        grade_element.style.outline = "none";
        grade_element.style.borderWidth = "0px";
        grade_element.style.padding = padding;
        grade_element.onchange = () => {
            score_change_handler(get_num(grade_element.value));
        };
        container.appendChild(grade_element);

        entry(get_letter_grade(percentage_grade)).style.fontWeight = "bold";
        return container;
    }

    // Grade Displayer
    function display_assignments() {
        for(let grade of grades) {
            add_table_entry(
                create_assignment_entry(
                    grade.assignment_name,
                    grade.date,
                    grade.category,
                    grade.weight,
                    grade.score,
                    grade.max,
                    grade.drop,
                    input => {
                        grade.score = input;
                        update_display();
                    },
                    input => {
                        grade.drop = input;
                        update_display();
                    }
                ));
        }
    }
    function display_classes() {
        for(let grade of grades) {
            add_table_entry(
                create_class_entry(
                    grade.class_name,
                    grade.grade,
                    grade.view_handler,
                    input => {
                        grade.grade = input;
                        update_display();
                    }
                ));
        }
    }
    function display_averages() {
        change_average_grade(get_avg_grade());
    }
    function update_display() {
        let average_grade;
        switch(get_type()) {
            case "assignment":
                label_assignment(entries_enum);
                display_assignments();

                average_grade = round(get_avg_grade(), 0);
                change_average_grade("[" + get_letter_grade(average_grade) + "] " + average_grade + "%");
                break;
            case "class":
                label_class();
                display_classes();

                average_grade = round(get_avg_grade());
                change_average_grade("GPA: " + get_gpa() + " | (" + average_grade + "%) [" + get_letter_grade(average_grade) + "]");
                break;
            default:
                console.error("Cannot update display: no proper type set (" + get_type() + ")");
        }
        style();
    }
    
    // Styling
    function style() {
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

    // Initialization
    let entries_enum = { // Use this as a template
        name: true,
        date: true,
        category: true,
        weight: true,
        score: true,
        max: true
    };
    function place_branding() {
        // Header
        let header = add_element(create_element("p"));
        header.id = "header";
        
        const text = document.createTextNode(program_name);
        header.appendChild(text);
        header.style.fontSize = "24px";
        header.style.fontWeight = "bold";
        
        header.style.textAlign = "center";
    }
    function init() {
        override_page_view(); // Hide current page
        driver_init(); // Run driver

        init_display(); // Initialize display

        place_branding(); // Brand GUI
        add_element(create_table()); // Add table to view
        add_average_grade_element(); // Add average grade footer

        update_display(); // Update display so grades are shown
    }

    // HTML Interactions (to help driver development)
    function get_num(string) {
        let parse_float = parseFloat(string);
        if(parse_float) return parse_float;
        return 0;
    }
    function get_path(path) {
        return document.querySelector(path);
    }
    function get_elements(name) {
        return document.getElementsByClassName(name)
    }
    function element_by_id(id){
        return document.getElementById(id);
    }

    /* API */
    function cancel_init() {
        document.head.hidden = false;
        document.body.hidden = false;
        throw 0;
    }
    function set_mode(mode) {
        switch(mode) {
            case "class":
                break;
            case "assignment":
                break;
            default:
                throw new Error("No valid mode type specified: " + mode);
        }
        set_type(mode);
        console.log("Mode set to '" + mode + "'");
    }
    function add_assignment(assignment_name, date, category, percent_weight, score, max_score, dropped) {
        add_managed_assignment(assignment_name, date, category, percent_weight, score, max_score, dropped)
    }
    function has_entries(name, date, category, weight, score, max) {
       entries_enum = {
            assignment_name: name,
            date: date,
            category: category,
            weight: weight,
            score: score,
            max: max
       };
    }
    function add_class(class_name, percentage_grade, view_handler) {
        add_managed_class(class_name, percentage_grade, view_handler);
        // add_table_entry(create_class_entry(class_name, percentage_grade, view_handler));
    }
    /* 
        How to make a driver:
        1. Tell the program which labels it will be provided using entries_enum
        2. Create logic for program to figure out whether to be in class view or assignment view
        3. Add classes and/or assignments accordingly
    */
    function driver_init() {
        // Grab source data
        if( get_path("#form2 > div:nth-child(4) > table > tbody > tr:nth-child(3) > td > center > table > tbody > tr:nth-child(1) > td:nth-child(3)") ||
            get_path("#ContentPlaceHolder1_DropDownList1") ||
            get_path("#ContentPlaceHolder1_txtUserName"))
        {
            cancel_init();
        }
        if(get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(2)")) {
            set_mode("class");
            // Get classes
            safe_run(() => {
                let element;
                let i = 2;
                while (true) {
                    element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child(" + i + ")");
                    if(!element) break;
                    let href = element.childNodes[1].childNodes[1].href;
                    add_class(  element.childNodes[2].innerText,
                                get_num(element.childNodes[6].innerText),
                                () => {location.href = href});
                    i++;
                }
            });
            return;
        }
        if(get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child(2)")) {
            set_mode("assignment");

            safe_run(() => {
                let element;
                let i = 2;
                while (true) {
                    element = get_path("#ContentPlaceHolder1_GridView2 > tbody > tr:nth-child("+ i + ")");
                    if(!element) break;
                    let nodes = element.childNodes;
                    console.log(get_num(nodes[5].innerText))
                    add_assignment(
                        nodes[4].innerText,
                        nodes[2].innerText,
                        nodes[3].innerText,
                        get_num(nodes[6].innerText),
                        get_num(nodes[5].innerText) ?? 0,
                        get_num(nodes[7].innerText),
                        nodes[9].childNodes[0].childNodes[0].checked
                    );
                    i++
                }
            });
        }
    }

    // Execution clause
    try {
        init(); // Initialize GUI
    } catch (e) {
        if(e !== 0)
            console.log(e);
    }
}