// ==UserScript==
// @name         Database Plus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  A nice upgrade to the peace database
// @author       You
// @match        http://peaceacademy.net/*
// @icon         https://static.toiimg.com/thumb/msid-51767839,imgsize-17046,width-400,resizemode-4/51767839.jpg
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function get_path(path) {
        return document.querySelector(path);
    }

    // Student grades
    function get_student_grade() {
        let result = 0;
        let element;
        let i = 0;
        while (true) {
            element = get_path("#ContentPlaceHolder1_GridView1 > tbody > tr:nth-child("+ (i + 2) + ")");
            if(element === null) break;
            result += parseFloat(element.childNodes[6].innerText);
            i++
        }
        result = result / i;
        return result;
    }
    console.log(get_student_grade());
    console.log(get_student_grade() / 25);

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
    console.log(get_class_grade());

})();