let username=prompt("Enter your name: ");
document.getElementById("username").innerHTML = `Welcome, <i><span style="color:#409eff ;">${username}!</span></i>`;


const CALORIE_API_KEY = "bX0y+1xPUSzMKOqHmMjkWw==zPg089IC9eThC0zo";
const UNSPLASH_ACCESS_KEY = "JOjOlbdc8DpH88iKYz5SO0Y6gmRjxSxU6Bbv6KWEyUE";

document.addEventListener("DOMContentLoaded", function () {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;

  const updateProgress = () => {
    let percent = Math.min((totalCalories / 2000) * 100, 100);
    document.getElementById("cal-progress").style.width = percent + "%";
  };

  const updateNutritionSummary = () => {
    document.getElementById("nutrition-summary").innerText =
      `Total: ${totalCalories} kcal | ${totalProtein}g Protein | ${totalFat}g Fat`;
    if (totalCalories > 2000) {
      Swal.fire({
        icon: "warning",
        text: "You've crossed your daily calorie limit!",
      });
    }
    updateProgress();
  };

  // 🧠 Fetch Nutrition + Image Together
  async function getFoodData(foodName) {
    try {
      // --- Nutrition from CalorieNinjas ---
      const nutritionRes = await fetch(
        `https://api.calorieninjas.com/v1/nutrition?query=${foodName}`,
        {
          headers: { "X-Api-Key": CALORIE_API_KEY }
        }
      );
      const nutritionData = await nutritionRes.json();
      const item = nutritionData.items?.[0];
      if (!item) throw new Error("No nutrition data found");

      // --- Image from Unsplash ---
      const imageRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${foodName}&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const imageData = await imageRes.json();
      const imageUrl = imageData.results?.[0]?.urls?.regular ||
        "https://via.placeholder.com/300x200?text=No+Image";

      return {
        name: item.name || foodName,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein_g),
        fat: Math.round(item.fat_total_g),
        image: imageUrl
      };
    } catch (error) {
      console.error("Error fetching food data:", error);
      return null;
    }
  }

  // 🍱 Handle Meal Form Submission
  document.getElementById("Meal-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const mealNameInput = document.getElementById("meal-name").value.trim().toLowerCase();
    const portion = parseFloat(document.getElementById("meal-portion").value.trim()) || 1;
    const notes = document.getElementById("meal-notes").value.trim();

    if (!mealNameInput) {
      Swal.fire({
        title: "Error",
        text: "Please enter a meal name.",
        icon: "error",
      });
      return;
    }

    const mealData = await getFoodData(mealNameInput);

    if (!mealData) {
      Swal.fire({
        title: "Meal Not Found",
        html: `<mark>${mealNameInput}</mark> not found in database!`,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const mealLog = document.getElementById("meal-log");
    if (mealLog.children.length && mealLog.children[0].innerText === "No meals logged yet.") {
      mealLog.innerHTML = "";
    }

    // 🧾 Create meal card
    const li = document.createElement("li");
    const now = new Date().toLocaleString();

    li.innerHTML = `
      <p><strong>Logged at:</strong> ${now}</p>
      <h3>${mealData.name}</h3>
      <img src="${mealData.image}" alt="${mealData.name}" width="150" height="100">
      <p><strong>Quantity:</strong> ${portion}</p>
      <p><strong>Calories:</strong> ${mealData.calories} kcal</p>
      <p><strong>Protein:</strong> ${mealData.protein} g</p>
      <p><strong>Fat:</strong> ${mealData.fat} g</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      <button class="delete-btn">Delete</button>
      <hr>
    `;

    // Store data
    li.dataset.calories = mealData.calories;
    li.dataset.protein = mealData.protein;
    li.dataset.fat = mealData.fat;

    mealLog.appendChild(li);

    totalCalories += mealData.calories;
    totalProtein += mealData.protein;
    totalFat += mealData.fat;
    updateNutritionSummary();

    document.getElementById("Meal-form").reset();

    // 🗑️ Delete functionality
    li.querySelector(".delete-btn").addEventListener("click", function () {
      totalCalories -= parseInt(li.dataset.calories);
      totalProtein -= parseInt(li.dataset.protein);
      totalFat -= parseInt(li.dataset.fat);
      li.remove();
      if (!mealLog.children.length) mealLog.innerHTML = "<li>No meals logged yet.</li>";
      updateNutritionSummary();
    });
  });
});

// 💬 AI Coach function (placed OUTSIDE the DOMContentLoaded)
async function askCoach() {
  let question = document.getElementById("userQuestion").value.trim();
  let responseBox = document.getElementById("coachResponse");

  if (!question) {
    responseBox.innerHTML = "Please type a question about your diet.";
    return;
  }

  responseBox.innerHTML = "⏳ Thinking...";

  const GEMINI_API_KEY = "AIzaSyB7N1tEXiqVfPk3C1tG6CtX8OtFIZoNAzE";

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }]
        })
      }
    );

    const data = await res.json();
    console.log(data);

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t generate an answer.";

    responseBox.innerHTML = answer;
  } catch (err) {
    console.error(err);
    responseBox.innerHTML = "⚠️ Error: Couldn’t reach Gemini API.";
  }
}
