

document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    const plansList = document.getElementById('plans-list');
    const addPlanForm = document.getElementById('add-plan-form');
    let selectedDate = new Date().toISOString().split('T')[0]; 

    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        select: function(info) {
            selectedDate = info.startStr;
            fetchPlans(selectedDate);
        },
        dateClick: function(info) {
            selectedDate = info.dateStr;
            fetchPlans(selectedDate);
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: 'auto',
        themeSystem: 'standard',
        
        
    });

    calendar.render();

    
    function fetchPlans(date = selectedDate) {
        fetch(`/api/plans/?date=${date}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    displayPlans(data.data);
                } else {
                    console.error(data.data.error);
                }
            })
            .catch(error => console.error('Error fetching plans:', error));
    }

    
    function displayPlans(plans) {
        plansList.innerHTML = '';
        if (plans.length === 0) {
            plansList.innerHTML = '<p>当天没有计划。</p>';
            return;
        }
        plans.forEach(plan => {
            const planDiv = document.createElement('div');
            planDiv.classList.add('plan-item', 'animate__animated', 'animate__fadeInUp');
            
            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('plan-details');
            detailsDiv.innerHTML = `<h3>${plan.title}</h3><p>${plan.description}</p>`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-button');
            deleteBtn.innerHTML = '删除';
            deleteBtn.addEventListener('click', () => deletePlan(plan.id));

            planDiv.appendChild(detailsDiv);
            planDiv.appendChild(deleteBtn);
            plansList.appendChild(planDiv);
        });
    }

    
    addPlanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('plan-title').value.trim();
        const description = document.getElementById('plan-description').value.trim();
        const date = selectedDate;

        if (!title || !date) {
            alert('标题和日期是必填项。');
            return;
        }

        fetch('/api/plans/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, date })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 201) {
                    alert('计划添加成功！');
                    fetchPlans(date);
                    addPlanForm.reset();
                } else {
                    alert(`错误: ${data.data.error}`);
                }
            })
            .catch(error => console.error('Error adding plan:', error));
    });

    
    function deletePlan(planId) {
        if (!confirm('确定要删除这个计划吗？')) return;

        fetch(`/api/plans/${planId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    alert('计划删除成功！');
                    fetchPlans(selectedDate);
                } else {
                    alert(`错误: ${data.data.error}`);
                }
            })
            .catch(error => console.error('Error deleting plan:', error));
    }

    
    fetchPlans(selectedDate);
});
