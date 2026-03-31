// ================================
// roster2.js - Full Refactored Production Version
// ================================

const RosterApp = (() => {

    // ================================
    // 1. Initialization & Guard
    // ================================
    const init = () => {
        const token = sessionStorage.getItem("access_token");
        const data = sessionStorage.getItem("googleData");

        console.log("INIT:", {
            token: !!token,
            googleData: data
        });

        // ❌ No token → must login
        if (!token) {
            console.warn("No token → redirect");
            window.location.href = "cover.html";
            return;
        }

        // ✅ First-time load (from Google)
        if (data) {
            try {
                const parsed = JSON.parse(data);
                RosterApp.restoreFromGoogle(parsed);

                // remove AFTER restore
                sessionStorage.removeItem("googleData");

            } catch (e) {
                console.error("Invalid Google data", e);
                sessionStorage.clear();
                window.location.href = "cover.html";
                return;
            }
        } else {
            // ✅ Already restored → just use localStorage
            console.log("Using existing localStorage (no googleData)");
        }

        // ✅ Always run UI setup
        populateClasses();
        showStudentsList();
    };
    console.log("INIT:", {
    token: !!sessionStorage.getItem("access_token"),
        googleData: sessionStorage.getItem("googleData")
    });
        // Prevent stale reuse
        //sessionStorage.removeItem("googleData");

    // ================================
    // 2. Google Drive Operations
    // ================================
    const overwriteFile = async () => {
        try {
            const accessToken = sessionStorage.getItem("access_token");
            if (!accessToken) { alert("❌ 尚未登入 Google，請先認證"); return; }

            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                localStorageData[key] = localStorage.getItem(key);
            }

            const jsonString = JSON.stringify(localStorageData, null, 2);
            const fileId = document.getElementById("pfileId").innerText.trim();
            const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

            const response = await fetch(url, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: jsonString,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            alert("✅ 成功更新 Google Drive 檔案");
            console.log("Drive update successful");

        } catch (err) {
            console.error("Overwrite failed:", err);
            alert("❌ 更新失敗，請確認已登入認證？");
        }
    };

    const logoutDrive = async () => {
        try {
            const accessToken = sessionStorage.getItem("access_token");
            if (!accessToken) { alert("未登入 Google"); return; }

            google.accounts.oauth2.revoke(accessToken, () => {
                console.log("Google token revoked");
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("googleData");
                localStorage.removeItem("gdrive_token");
                alert("已登出 Google Drive");
                window.location.href = "cover.html";
            });
        } catch (err) {
            console.error("Logout failed:", err);
            alert("❌ 登出失敗");
        }
    };

    // ================================
    // 3. Popup & Form Handling
    // ================================
    const openPopup = id => { 
            const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    };
    const closePopup = () => {
    ['addStudentPopup','addClassPopup','addStudentOrgPopup','readOrgPopup','readPopup']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    };
    const showAddStudentForm = () => openPopup('addStudentPopup');
    const showAddClassForm = () => openPopup('addClassPopup');
    const showAddStudentOrgForm = () => openPopup('addStudentOrgPopup');
    const showReadOrgForm = () => openPopup('readOrgPopup');
    const showReadForm = () => openPopup('readPopup');

    const handleSubmit = async () => {
        const classAdded = addClass();
        if (!classAdded) return;
        await addOrg();
    };

    const addClass = () => {
        const newClassName = document.getElementById('newClassName')?.value.trim();
        const classSelector = document.getElementById('classSelector');
        if (!newClassName) { alert("請輸入日期."); return false; }

        if (Array.from(classSelector.options).some(o => o.value===newClassName)) {
            alert("此堂次已存在，請勿重複新增。"); return false;
        }

        const newOption = document.createElement('option');
        newOption.value = newClassName; newOption.text = newClassName;
        classSelector.add(newOption);
        classSelector.value = newClassName;

        showStudentsList(); saveClasses(); closePopup();
        return true;
    };

    const addStudent = () => {
        const newStudentName = document.getElementById('newStudentName')?.value.trim();
        const newStudentRoll = document.getElementById('newStudentRoll')?.value.trim();
        if (!newStudentName || !newStudentRoll) { alert("Please provide both name and roll number."); return; }

        const classSelector = document.getElementById('classSelector');
        const selectedClass = classSelector.value;

        const students = JSON.parse(localStorage.getItem('students'))||{};
        if ((students[selectedClass]||[]).some(s=>s.rollNumber===newStudentRoll)) {
            alert(`Roll number ${newStudentRoll} 重複 in ${selectedClass}`); return;
        }

        addStudentToList(newStudentName,newStudentRoll);
    };

    const addOrg = async () => {
        try {
            const rData = await (await fetch("https://mintetang.github.io/roster3/scripts/nameroll1.json")).json();
            rData.data.forEach(({name,rollNumber})=>{ if(name&&rollNumber) addStudentToList(name,rollNumber); });
        } catch(e){ console.error("addOrg failed:",e); alert("❌ 無法讀取名單檔案"); }
    };

    // ================================
    // 4. Students & Attendance
    // ================================
    // Helper to create a <li> for a student (used by showStudentsList & addStudent)
    const createStudentLi = (name, rollNumber, selectedClass) => {
        const li = document.createElement('li');
        li.dataset.rollNumber = rollNumber;
        li.innerHTML = `<strong>${name}</strong> ${rollNumber}`;

        const status1 = getSavedAttendance(selectedClass, name, 'status1') || 'reset';
        const status2 = getSavedAttendance(selectedClass, name, 'status2') || 'reset';

        li.append(
            createAttendanceToggle('status1', li, selectedClass, status1, { reset: '(1)⬜', present: '(1)✅' }),
            createAttendanceToggle('status2', li, selectedClass, status2, { reset: '(2)⬜', present: '(2)✔️' })
        );
        return li;
    };
    // ================================
    // Get saved attendance helper
    // ================================
    const getSavedAttendance = (className, studentName, type) => {
        try {
            const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
            const record = attendanceData.find(r => r.class === className && r.name === studentName);
            return record ? record[type] || 'reset' : 'reset';
        } catch (e) {
            console.error("getSavedAttendance error:", e);
            return 'reset';
        }
    };
    const showStudentsList = () => {
        const classSelector = document.getElementById('classSelector');
        if (!classSelector || classSelector.selectedIndex === -1) return;
        const selectedClass = classSelector.value;

        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;
        studentsList.innerHTML = '';

        const savedStudents = JSON.parse(localStorage.getItem('students')) || {};
        const students = savedStudents[selectedClass] || [];

        students.forEach(student => {
            studentsList.appendChild(createStudentLi(student.name, student.rollNumber, selectedClass));
        });

        showSummary(selectedClass);
        showAttendanceResult(selectedClass);
    };

    const addStudentToList = (name, rollNumber) => {
        const classSelector = document.getElementById('classSelector');
        if (!classSelector) return;
        const selectedClass = classSelector.value;

        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;

        // Append new student
        studentsList.appendChild(createStudentLi(name, rollNumber, selectedClass));

        // Update storage
        saveStudentsList(selectedClass);
        updateAttendanceRecord(name, selectedClass, 'status1', 'reset');
        updateAttendanceRecord(name, selectedClass, 'status2', 'reset');

        closePopup();
    };

    const createAttendanceToggle = (type, li, selectedClass, initial = 'reset', icons = { reset: '⬜', present: '✅' }) => {
        const btn = createButton(icons[initial], type, () => {
            const current = btn.dataset.status;
            const nextStatus = current === 'reset' ? 'present' : 'reset';
            markAttendance(type, nextStatus, li, selectedClass);
            btn.dataset.status = nextStatus;
            btn.textContent = icons[nextStatus];
            btn.className = nextStatus === 'present' ? type : 'reset';
        });
        btn.dataset.status = initial;
        btn.textContent = initial === 'present' ? icons.present : icons.reset;
        btn.className = initial === 'present' ? type : 'reset';
        return btn;
    };

    const markAttendance = (type, value, li, selectedClass) => {
        const name = li.querySelector('strong').innerText;
        updateAttendanceRecord(name, selectedClass, type, value);
        showSummary(selectedClass);
    };

    const updateAttendanceRecord = (name, selectedClass, type, value) => {
        const data = JSON.parse(localStorage.getItem('attendanceData'))||[];
        const idx = data.findIndex(r=>r.name===name && r.class===selectedClass);
        if(idx!==-1){ data[idx][type]=value; data[idx].date=getCurrentDate(); }
        else { data.push({name, class:selectedClass, status1:type==='status1'?value:'reset', status2:type==='status2'?value:'reset', date:getCurrentDate()}); }
        localStorage.setItem('attendanceData', JSON.stringify(data));
    };

    const showSummary = selectedClass => {
        const data = JSON.parse(localStorage.getItem('attendanceData'))||[];
        const filtered = data.filter(r=>r.class===selectedClass);
        const total = filtered.length;
        const present1 = filtered.filter(r=>r.status1==='present').length;
        const present2 = filtered.filter(r=>r.status2==='present').length;

        document.getElementById('totalStudents').innerText = total;
        document.getElementById('totalPresent1').innerText = present1;
        //document.getElementById('totalAbsent1').innerText = total-present1;
        document.getElementById('totalPresent2').innerText = present2;
        //document.getElementById('totalAbsent2').innerText = total-present2;
    };

    // ================================
    // 5. Classes Management
    // ================================
    const populateClasses = () => {
        const saved = JSON.parse(localStorage.getItem('classes'))||[];
        const classSelector=document.getElementById('classSelector'); 
        classSelector.innerHTML='';
        saved.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.text=c; classSelector.add(opt); });
        const savedSelected = localStorage.getItem('selectedClass');
        if(savedSelected && saved.includes(savedSelected)) classSelector.value = savedSelected;
    };

    const saveClasses = () => {
        const classSelector=document.getElementById('classSelector');
        localStorage.setItem('classes', JSON.stringify(Array.from(classSelector.options).map(o=>o.value)));
    };

    const saveStudentsList = (selectedClass) => {
        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;
        const students = Array.from(studentsList.children).map(li => ({
            name: li.querySelector('strong').innerText,
            rollNumber: li.dataset.rollNumber
        }));
        const allStudents = JSON.parse(localStorage.getItem('students'))||{};
        allStudents[selectedClass] = students;
        localStorage.setItem('students', JSON.stringify(allStudents));
    };

    // ================================
    // 6. Attendance Reporting
    // ================================
    const submitAttendance = () => {
        const classSelector=document.getElementById('classSelector');
        if(!classSelector || classSelector.selectedIndex===-1) return;
        const selectedClass = classSelector.value;
        showAttendanceResult(selectedClass);
        document.getElementById("resultSection").scrollIntoView({behavior:"smooth"});
    };

    const showAttendanceResult = (selectedClass) => {
        const data = JSON.parse(localStorage.getItem('attendanceData'))||[];
        const filtered = data.filter(r=>r.class===selectedClass);
        const total = filtered.length;
        const present1 = filtered.filter(r=>r.status1==='present').length;
        const present2 = filtered.filter(r=>r.status2==='present').length;
        const rate1 = total>0?Math.round(present1/total*100)+'%':'0%';
        const rate2 = total>0?Math.round(present2/total*100)+'%':'0%';
        const overall = total>0?Math.round((present1+present2)/total*100)+'%':'0%';

        document.getElementById('attendanceDate').innerText=getCurrentDate();
        document.getElementById('attendanceTime').innerText=new Date().toLocaleTimeString();
        document.getElementById('attendanceClass').innerText=selectedClass;
        document.getElementById('attendanceTotalStudents').innerText=total;
        document.getElementById('attendancePresent').innerText=present1+present2;
        document.getElementById('attendanceAbsent').innerText=total-(present1+present2);
        document.getElementById('attendanceRate1').innerText=rate1;
        document.getElementById('attendanceRate2').innerText=rate2;
        document.getElementById('attendanceRate').innerText=overall;
        document.getElementById('resultSection').style.display='block';
    };

    // ================================
    // 7. Export / Restore
    // ================================
    const exportLocalStorage = () => {
        const data={}; 
        for(let i=0;i<localStorage.length;i++){ 
            const k=localStorage.key(i); 
            data[k]=localStorage.getItem(k);
        }
        const blob = new Blob([JSON.stringify(data,null,4)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); 
        link.href = url; 
        link.download = `data_${getFormattedDateTime()}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const rlsFromFile = e => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                localStorage.clear(); 
                for(const k in data) localStorage.setItem(k, data[k]);
                alert('成功讀回出席紀錄!'); 
                location.reload();
            } catch(err) { console.error(err); }
        };
        reader.readAsText(file);
        closePopup();
    };

    const restoreFromGoogle = (data) => {
        try {
            console.log("Incoming Google data:", data);

            if (!data || typeof data !== 'object') {
                console.warn("⚠️ Invalid Google data → skip restore");
                return;
            }

            // ✅ Clear only when valid
            localStorage.clear();

            for (const k in data) {
                let value = data[k];

                // ✅ Normalize EVERYTHING to string
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                } else if (typeof value !== 'string') {
                    value = String(value);
                }

                localStorage.setItem(k, value);
            }

            console.log("✅ Restored localStorage:", localStorage);

            // ✅ SAFE EXECUTION (critical fix)
            try {
                populateClasses();
                showStudentsList();
            } catch (uiErr) {
                console.error("⚠️ UI render error (non-fatal):", uiErr);
            }

        } catch (e) {
            console.error("❌ Restore error:", e);

            alert("❌ 資料載入失敗，請重新登入");
            sessionStorage.clear();
            window.location.href = "cover.html";
        }
    };

    // ================================
    // 8. Search & Highlight
    // ================================
    const highlightSearchTerm = (term, id) => {
        const el = document.getElementById(id); if(!el) return;
        el.innerHTML = el.innerHTML.replace(/<\/?mark>/g,'')
            .replace(new RegExp(`(${term})`, 'ig'),"<mark class='highlight'>$1</mark>");
    };
    const scrollToHighlightedTerm = () => document.querySelector('.highlight')?.scrollIntoView({behavior:'smooth',block:'center'});
    const searchAndHighlight = async () => {
        const term = document.getElementById("searchTermInput").value;
        highlightSearchTerm(term,'studentsList'); 
        scrollToHighlightedTerm(); 
        await sleep(2000); 
        location.reload();
    };

    // ================================
    // 9. Utility Functions
    // ================================
    const getCurrentDate = () => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    };
    const getFormattedDateTime = () => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}-${String(n.getHours()).padStart(2,'0')}-${String(n.getMinutes()).padStart(2,'0')}`;
    };
    const sleep = ms => new Promise(r => setTimeout(r,ms));
    const createButton = (txt, cls, fn) => { const b = document.createElement('button'); b.type='button'; b.innerText=txt; b.className=cls; b.onclick=fn; return b; };

    // ================================
    // 10. Attendance History / Chart
    // ================================
    const histRate = () => {
        const classSelector = document.
            getElementById('classSelector');

        if (!classSelector || !classSelector.options ||
            classSelector.selectedIndex === -1) {
            console.error
                ('Class selector is not properly defined or has no options.');
            return;
        }
        const selectedClass = classSelector.
            options[classSelector.selectedIndex].value;

        if (!selectedClass) {
            console.error('Selected class is not valid.');
            return;
        }
        //set attText and attClass
        attText = document.getElementById('attendanceRate').innerText;
        if (attText === 'NaN%')
            {console.log('need to have attendance data to output');
                return;
            };
        attClass = selectedClass;
        //console.log(attClass);
        //console.log(attText);  
        //make attendance history session here
        //const hisSection = document.getElementById('hisSection');
        //document.getElementById("hisSection").innerText="TBD";
        // Add content from localStorage attHis

        if (localStorage.getItem('attHis') === null){
            console.log('no data in attHis');
            }
            else {
            //document.getElementById("attP").innerText = localStorage.getItem('attHis');
            console.log(localStorage.getItem('attHis'));
            }
        //attObj to record the class and the attendance rate 
        attObj = {'date': attClass,'per': attText};
        //console.log(attObj);
        let attArray = JSON.parse(localStorage.getItem('attHis'));
        //console.log(attArray);
        if (attArray === null) {
        attArray = [];
        attArray.push(attObj);
        //console.log(attArray);
        } 
        else if (JSON.stringify(attArray).includes(attClass) !== false){
            // Find object with the attClass;
            //indexToUpdate = attArray.findIndex((obj) => attClass in obj );
            indexToUpdate = attArray.findIndex(obj => obj.date === attObj.date);
            //console.log(indexToUpdate);
            attArray.splice(indexToUpdate, 1, attObj); 
            // Remove 1 element at indexToUpdate and insert newObject
            //console.log(attArray);
        }
        else {
        attArray.push(attObj);
        //console.log(attArray);
        }
        attArray.sort((a, b) => 
            a.date.localeCompare(b.date));
        //save attendance history to localStorage attHis
        localStorage.setItem('attHis', 
            JSON.stringify(attArray));
        //document.getElementById("attP").innerText = localStorage.getItem('attHis');

        //myChart

        const arrayOfObjects = attArray;
        const { date, per } = arrayOfObjects.reduce((acc, obj) => {
        acc.date.push(obj.date);
        acc.per.push(obj.per);
        return acc;
        }, { date: [], per: [] });

        //const stringArray = ["10", "21", "3", "14", "53"];
        const perInt = per.map(function(str) {
        return parseInt(str, 10); // 10 specifies decimal radix
        });
        
        console.log(per);

        const ctx = document.getElementById('myChart').getContext('2d');
            if(Chart.getChart("myChart")) {
        Chart.getChart("myChart")?.destroy()
            }                                                                           
        mychart = new Chart(ctx, {
            type: 'bar', // or 'line', 'pie', etc.
            data: {
                labels: date, // Array for labels on the x-axis
                datasets: [{
                    label: '出席率',
                    data: perInt, // Your array of data points
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        title: {
                        display: true,
                        text: '出席率 (%)'}, // Your Y-axis label
                        beginAtZero: true
                    }
                }
            }
        });
        // Append the new div to the result session
    };

        return {
            init, overwriteFile, logoutDrive, showStudentsList, addStudentToList,
            saveClasses, populateClasses, submitAttendance, exportLocalStorage, rlsFromFile,
            restoreFromGoogle, highlightSearchTerm, scrollToHighlightedTerm, searchAndHighlight,
            showAddStudentForm, showAddClassForm, showAddStudentOrgForm, showReadOrgForm, showReadForm,
            getSavedAttendance,histRate,showAttendanceResult,handleSubmit,closePopup,addStudent,
            rlsFromFile,  
        };

    })();
// ================================
// Delete selected class and all related data (students, attendance records, colors, history)
// ================================
    function cleanSelectedClass()
        {
        const reCheck = prompt('！！！請輸入"YES"來確認刪除目前的日期出席記錄，確認後"無法回復"！！！');
        //console.log(reCheck); 
        if (reCheck === 'YES') {
    // Perform actions for cancellation, e.g., stop further processing

        const classSelector = 
            document.getElementById('classSelector');
        const selectedClass = classSelector.
            options[classSelector.selectedIndex].value;
            //console.log(selectedClass);
        //delete the studentlist from the selectedClass
        const savedStudents = JSON.parse
                (localStorage.getItem('students'));

        delete savedStudents[selectedClass];
        //console.log(savedStudents);
        localStorage.setItem
                ('students', JSON.stringify(savedStudents));

        // delete selectedClass
        let localClass = JSON.parse
                (localStorage.getItem('classes'));

        index = localClass.findIndex(delClass => delClass === selectedClass);
        localClass.splice(index, 1);
        //console.log(localClass);
        localStorage.setItem
                ('classes', JSON.stringify(localClass));
        // delete selectedClass attendanceData records
        const attendanceData =
            JSON.parse(localStorage.getItem('attendanceData')) || [];

        const cleanedAttendanceData = attendanceData.filter(
            record => record.class !== selectedClass
        );

        localStorage.setItem(
            'attendanceData',
            JSON.stringify(cleanedAttendanceData)
        );

        // delete selectedClass colors
        const colors =
            JSON.parse(localStorage.getItem('colors')) || {};

        if (colors[selectedClass]) {
            delete colors[selectedClass];
            localStorage.setItem(
                'colors',
                JSON.stringify(colors)
            );
        }
        // delete selectedClass attendance rate history
        const newatt = JSON.parse
                (localStorage.getItem('attHis'));
        indexToDel = newatt.findIndex((obj) => selectedClass in obj );
        newatt.splice(indexToDel, 1);
        localStorage.setItem('attHis', 
            JSON.stringify(newatt));
        alert(`${selectedClass}已刪除！`);
        //refresh
        location.reload();
        //localStorage.clear();
        } else {
        alert("輸入錯誤，無法刪除！");
        }

    }
// ================================
// Initialize on DOM ready
// ================================
window.addEventListener("DOMContentLoaded", RosterApp.init);

window.overwriteFile = RosterApp.overwriteFile;
window.logoutDrive = RosterApp.logoutDrive;
window.showStudentsList = RosterApp.showStudentsList;
window.submitAttendance = RosterApp.submitAttendance;
window.histRate = RosterApp.histRate;
window.exportLocalStorage = RosterApp.exportLocalStorage;
window.searchAndHighlight = RosterApp.searchAndHighlight;
window.showAddClassForm = RosterApp.showAddClassForm;
window.showAddStudentForm = RosterApp.showAddStudentForm;
window.showAttendanceResult = RosterApp.showAttendanceResult;
window.handleSubmit = RosterApp.handleSubmit;
window.closePopup = RosterApp.closePopup;
window.addStudent = RosterApp.addStudent;
window.rlsFromFile = RosterApp.rlsFromFile;