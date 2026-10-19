# MAZ School

Homeschool learning missions, hosted at https://mazschool.com with GitHub Pages.

## How the site is organized

- `index.html`: home page with the three subjects and games
- `math/`, `reading/`, `science/`: each subject's year, 36 weeks in units
- `lesson/`: one page that shows any week, for example `lesson/?s=math&w=5`
- `moon-bakery/`: the Moon Bakery Math game and lesson guide
- `assets/curriculum.js`: every lesson's title, goal, materials, steps and quick-check questions
- `assets/site.js` and `assets/site.css`: the shared header (with the Home button), layout and progress tracking
- `CNAME`: tells GitHub Pages to use mazschool.com. Don't delete it.

## Changing a lesson

Open `assets/curriculum.js`, find the week by its title, and edit the text. Each week looks like:
["Title", "Goal", "Materials", ["Step 1", "Step 2", "Step 3"], [["Question", ["Right answer", "Wrong", "Wrong"], 0], ...]]
The 0 means the first answer is the right one. The page mixes up the order when it shows them.

Progress (weeks marked done) is saved in each device's browser.
