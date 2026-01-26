function showStudentsList() {
    const classSelector = 
        document.getElementById('classSelector');
    const selectedClass = classSelector.
        options[classSelector.selectedIndex].value;
    const studentsList = 
        document.getElementById('studentsList');
    studentsList.innerHTML = '';

    // Retrieve students from local storage
    const savedStudents = JSON.parse
        (localStorage.getItem('students')) || {};
    const selectedClassStudents = 
        savedStudents[selectedClass] || [];

    selectedClassStudents.forEach(student => {
        const listItem = document.createElement('li');
        listItem.setAttribute
            ('data-roll-number', student.rollNumber);
        listItem.innerHTML = 
            `<strong>
                ${student.name}
            </strong> 
            (Roll No. ${student.rollNumber})`;

        const absentButton = createButton('缺席', 'absent', 
            () => markAttendance('absent', listItem, selectedClass));
        const presentButton = createButton('出席', 'present', 
            () => markAttendance('present', listItem, selectedClass));
        const leaveButton = createButton('請假', 'leave', 
            () => markAttendance('leave', listItem, selectedClass));
        const resetButton =
        createButton('重設', 'reset',
            () => markAttendance('reset', listItem, selectedClass));

        const savedColor = getSavedColor
            (selectedClass, student.rollNumber);
        if (savedColor) {
            listItem.style.backgroundColor = savedColor;
        }

        listItem.appendChild(absentButton);
        listItem.appendChild(presentButton);
        listItem.appendChild(leaveButton);
        listItem.appendChild(resetButton); //jt 0928 night

        studentsList.appendChild(listItem);
    });