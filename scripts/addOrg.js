function addOrg() {
    // Get input values
    const jsonArrayString = '[{"name":"Q1", "roll":"101"},{"name":"Q2", "roll":"102"}]';
    const jsArray = JSON.parse(jsonArrayString);
    console.log(jsArray.length);
    for (let i = 0; i < jsArray.length; i++) {
    const newStudentName = jsArray[i].name;
    const newStudentRoll = jsArray[i].roll;
    if (!newStudentName || !newStudentRoll) {
        alert("Missing name or roll number.");
        return;
    }

    // Add the new student to the list
    const classSelector = document.
        getElementById('classSelector');
    const selectedClass = classSelector.
        options[classSelector.selectedIndex].value;
    const studentsList = document.
        getElementById('studentsList');

    const listItem = document.createElement('li');
    listItem.setAttribute('data-roll-number', newStudentRoll);
    listItem.innerHTML =
        `<strong>
            ${newStudentName}
        </strong> 
        (Roll No. ${newStudentRoll})`;

    const absentButton =
        createButton('A', 'absent',
            () => markAttendance('absent', listItem, selectedClass));
    const presentButton =
        createButton('P', 'present',
            () => markAttendance('present', listItem, selectedClass));
    const leaveButton =
        createButton('L', 'leave',
            () => markAttendance('leave', listItem, selectedClass));

    listItem.appendChild(absentButton);
    listItem.appendChild(presentButton);
    listItem.appendChild(leaveButton);

    studentsList.appendChild(listItem);
    saveStudentsList(selectedClass);
    }
    closePopup();
}