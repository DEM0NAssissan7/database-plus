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
    // Basic Functions
    function create_element(name) {
        return document.createElement(name);
    }

    // Math
    function round(number, accuracy) {
        if(accuracy) return Math.round(number * Math.pow(10, accuracy)) / Math.pow(10, accuracy)
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

    /* Grade Manager */
    {
        let class_grade_average = 0;
        let assignment_grade_average = 0;
        let gpa = 0;
        let assignments = [];
        let classes = [];
        function Assignment (name, date, category, percent_weight, score, max_score, id) {
            this.assignment_name = name;
            this.date = date;
            this.category = category;
            this.weight = percent_weight;
            this.score = score;
            this.max = max_score;
        }
        function Class (name, percent_grade) {
            this.class_name = name;
            this.grade = percent_grade;
            this.letter_grade = get_letter_grade(percent_grade);
        }
        function get_offensiveness(assignment) {
            let offensiveness = (average_grade - (assignment.score / assignment.max_score)) * assignment.weight;
            if(offensiveness === 0) offensiveness = -0.01 * assignment.weight;
            return offensiveness;
        }
    }

    /* Display engine */
    let display, table;
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
        table.style.paddingTop = "50px";
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

    // Table management
    function add_table_entry(element) {
        table.appendChild(element);
    }
    function clear_table() {
        table = create_table();
        document.getElementById("d_table").replaceWith(table);
    }
    function create_table_entry(...fields) {
        let container = create_element("tr");
        function entry(text) {
            let td = create_element("td");
            td.innerText = text;
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
        if(entries_enum.name) entries.push("Name");
        if(entries_enum.category) entries.push("Category");
        if(entries_enum.weight) entries.push("% Weight");
        if(entries_enum.score) entries.push("Score");
        if(entries_enum.max) entries.push("Max");
        if(entries_enum.max && entries_enum.score) entries.push("% Score");
        add_table_entry(
            create_table_entry( "Date", 
                                "Name", 
                                "Category",
                                "% Weight",
                                "Score",
                                "Max",
                                "% Score")
        );
    }
    function label_class() {
        clear_table();
        add_table_entry(
            create_table_entry( "",
                                " Name ", 
                                " % Grade ", 
                                " Letter Grade ")
        );
    }
    function create_assignment_entry(assignment_name, date, category, percent_weight, score, max_score) {
        let container = create_element("tr");
        function entry(text) {
            let td = create_element("td");
            td.innerText = text;
            container.appendChild(td);
            return td;
        }
        if(date) entry(date);
        if(assignment_name) entry(assignment_name);
        if(category) entry(category);
        if(percent_weight) entry(round(percent_weight));
        if(score !== null) entry(round(score)).contentEditable=true;
        if(max_score !== null) entry(max_score);
        if(score !== null && max_score !== null) entry(round(score/max_score)).contentEditable=true;
        return container;
    }
    function create_class_entry(class_name, percentage_grade, view_handler) {
        let container = create_element("tr");
        function entry(text) {
            let td = create_element("td");
            td.innerText = text;
            container.appendChild(td);
            return td;
        }
        let button = create_element("button");
        button.onclick = view_handler;
        button.innerText = "View";

        container.appendChild(button);
        entry(class_name);
        entry(round(percentage_grade)).contentEditable = true;
        entry(get_letter_grade(percentage_grade));
        return container;
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
                _element.style.outlineColor = "gray";
                _element.style.outlineStyle = "groove";
                _element.style.outlineWidth = "thin";
                _element.style.textAlign = "center";
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
        let a = add_element(create_element("a"));
        a.innerText = '\n\n'
    }
    function init() {
        init_display();
        add_element(create_table());
        override_page_view();
    }
    init();
    place_branding();

    /* API */
    function set_mode(mode) {
        switch(mode) {
            case "class":
                label_class();
                break;
            case "assignment":
                label_assignment(entries_enum);
                break;
            default:
                throw new Error("No valid mode type specified: " + mode);
        }
        console.log("Mode set to '" + mode + "'");
    }
    function add_assignment(assignment_name, date, category, percent_weight, score, max_score) {
       add_table_entry(create_class_entry(assignment_name, date, category, percent_weight, score, max_score));
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
        add_table_entry(create_class_entry(class_name, percentage_grade, view_handler));
    }
    function driver_init() {
        // Grab source data
        set_mode("class");
        add_class("Biology", 90);
        style();
    }
    driver_init();
}