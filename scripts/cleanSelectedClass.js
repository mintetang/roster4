function cleanSelectedClass()
    {
    const selectedClass = classSelector.
        options[classSelector.selectedIndex].value;
    //delete the studentlist from the selectedClass
    const savedStudents = JSON.parse
            (localStorage.getItem('students')) || {};

    const savedStudents2 = delete savedStudents[selectedClass];
    console.log(savedStudents2);
    localStorage.setItem
            ('students', JSON.stringify(savedStudents2));

    // delete selectedClass
    const localClass = JSON.parse
            (localStorage.getItem('classes'));

    index = localClass.findIndex(delClass => delClass === selectedClass);
    localClass2 = localClass.splice(index, 1);
    localStorage.setItem
            ('classes', JSON.stringify(localClass2));
    document.location.reload();
    }