'use strict';

// Navigation: keep the compact menu accessible and close it after navigation.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();

// Room filters use the same visible cards without duplicating content.
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-size]').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.size !== button.dataset.filter;
    });
  });
});

// Native dialogs provide focus containment, Escape dismissal, and focus restoration.
const planner = document.querySelector('#planner');
const form = document.querySelector('#meeting-form');
const result = document.querySelector('#planner-result');
const roomCapacity = { 'The Huddle': 6, 'The Boardroom': 12, 'The Workshop': 20 };
let meetingPlan = null;
let dialogTrigger = null;
function updateCapacity() {
  const people = form.elements.people;
  people.max = roomCapacity[form.elements.room.value];
  if (Number(people.value) > Number(people.max)) people.value = people.max;
}
function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function openPlanner(trigger, room) {
  dialogTrigger = trigger;
  form.hidden = false;
  result.hidden = true;
  if (room) form.elements.room.value = room;
  form.elements.date.min = localDate();
  updateCapacity();
  closeMenu();
  planner.showModal();
}
document.querySelectorAll('[data-plan]').forEach(button => {
  button.addEventListener('click', () => openPlanner(button, button.dataset.room));
});
form.elements.room.addEventListener('change', updateCapacity);
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { dialogTrigger?.focus(); });
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  meetingPlan = Object.fromEntries(new FormData(form));
  const date = new Date(`${meetingPlan.date}T${meetingPlan.time}`);
  const formatted = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(date);
  document.querySelector('#plan-summary').textContent = `${meetingPlan.room} · ${meetingPlan.people} people · ${formatted} · ${meetingPlan.duration} · ${meetingPlan.format}`;
  form.hidden = true;
  result.hidden = false;
  document.querySelector('#download-plan').focus();
});
document.querySelector('#edit-plan').addEventListener('click', () => {
  result.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});
document.querySelector('#download-plan').addEventListener('click', () => {
  if (!meetingPlan) return;
  const text = [
    'NEXVENUS — MEETING BRIEF',
    'Planning document only. This is not a confirmed reservation.',
    '',
    `Organiser: ${meetingPlan.name}`,
    `Email: ${meetingPlan.email}`,
    `Room: ${meetingPlan.room}`,
    `Attendees: ${meetingPlan.people}`,
    `Date: ${meetingPlan.date}`,
    `Time: ${meetingPlan.time} (organiser’s local time)`,
    `Duration: ${meetingPlan.duration}`,
    `Format: ${meetingPlan.format}`,
    '',
    'Meeting purpose / notes:',
    meetingPlan.notes || 'No notes added.',
    '',
    'Next step: arrange room availability and confirmation with your venue.'
  ].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `nexvenus-meeting-${meetingPlan.date}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Resource guides are bundled with the site and work without an external service.
const guides = {
  progress: {
    title: 'How to turn your next team meeting into real progress',
    sections: [
      [null, 'A useful meeting gives people a shared understanding and a clear next step. A little preparation makes the time together count.'],
      ['Start with one clear outcome', 'Before you send an invitation, finish this sentence: “By the end of this meeting, we will…” Make the outcome specific: choose an approach, unblock a project, or agree on a plan.'],
      ['Give everyone a chance to prepare', 'Share a short agenda and any essential context in advance. Separate information people can read on their own from decisions that need a conversation. Invite only the people needed for those decisions.'],
      ['Make space for every voice', 'If your meeting is hybrid, test the sound and display before you begin. Ask remote participants for their views directly, and put shared notes somewhere everyone can see them.'],
      ['Close with decisions and owners', 'Leave the final five minutes for a recap. Write down what was decided, who will do what, and when each action is due. Share those notes while the conversation is still fresh.']
    ]
  },
  room: {
    title: 'Choosing the right room for your next big conversation',
    sections: [
      [null, 'The best room fits the conversation you want to have. Think about your people, your purpose, and the tools you need before choosing a space.'],
      ['Match the space to the purpose', 'A private discussion benefits from a small, quiet room. A client presentation needs a clear display and comfortable seating. A workshop needs space for participants to move, work in groups, and share ideas.'],
      ['Count everyone who will attend', 'Allow a seat for every in-person attendee, plus space for laptops and materials. For a hybrid meeting, consider where the camera sits and whether remote guests can hear each person at the table.'],
      ['Check the essentials', 'Confirm connectivity, screen connections, audio, accessibility, and refreshment arrangements. Share any specific needs with the venue before the day of your meeting.'],
      ['Allow a little setup time', 'Plan to arrive before your guests. Open your presentation, test the equipment, and arrange your materials. A calm start helps everyone focus on the conversation.']
    ]
  }
};
const articleDialog = document.querySelector('#article-dialog');
document.querySelectorAll('[data-article]').forEach(button => {
  button.addEventListener('click', () => {
    const guide = guides[button.dataset.article];
    dialogTrigger = button;
    document.querySelector('#article-title').textContent = guide.title;
    const body = document.querySelector('#article-body');
    body.replaceChildren();
    guide.sections.forEach(([heading, paragraph]) => {
      if (heading) {
        const title = document.createElement('h3');
        title.textContent = heading;
        body.append(title);
      }
      const text = document.createElement('p');
      text.textContent = paragraph;
      body.append(text);
    });
    articleDialog.showModal();
  });
});
document.querySelector('[data-article-plan]').addEventListener('click', () => {
  const trigger = dialogTrigger;
  articleDialog.close();
  openPlanner(trigger);
});
