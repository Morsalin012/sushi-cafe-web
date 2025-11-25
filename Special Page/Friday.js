document.addEventListener("DOMContentLoaded", function () 
{
  const form = document.getElementById("SushiForm");
  const nameInput = document.getElementById("name");
  const genderSelect = document.getElementById("gender");
  const sushiSelect = document.getElementById("sushi");
  const orchidSection = document.getElementById("Orchid");
  const summaryDiv = document.getElementById("OrderSummary");

  // Save the Orchid 
  let orchidOption = null;
  for (let option of sushiSelect.options)
  {
    if (option.value === "Orchid Princess Roll Sushi") 
    {
      orchidOption = option;
      break;
    }
  }

  function updateSushiOptions() 
  {
    const gender = genderSelect.value;

    if (gender === "Male")
    {
      // Remove Orchid 
      if (orchidOption && orchidOption.parentElement) 
      {
        orchidOption.remove();
      }
      orchidSection.style.display = "none"; // hide section just in case
    }
    else {
      // add Orchid 
      let exists = Array.from(sushiSelect.options).some((opt) => opt.value === "Orchid Princess Roll Sushi");

      if (!exists && orchidOption) 
      {
        sushiSelect.add(orchidOption); 
      }
    }
  }

  //  gender change
  genderSelect.addEventListener("change", updateSushiOptions);

  // italso hide/show Orchid section depending on selection and gender
  function toggleOrchidSection() 
  {
    const sushi = sushiSelect.value;
    const gender = genderSelect.value;

    if (sushi === "Orchid Princess Roll Sushi" && gender === "Female") 
    {
      orchidSection.style.display = "block";
    }
    else 
    {
      orchidSection.style.display = "none";
    }
  }

  sushiSelect.addEventListener("change", toggleOrchidSection);
  genderSelect.addEventListener("change", toggleOrchidSection);

  // Initial setup
  updateSushiOptions();
  toggleOrchidSection();

  // Form submission
  form.addEventListener("submit", function (e) 
  {
    e.preventDefault();
    const name = nameInput.value.trim();
    const gender = genderSelect.value;
    const sushi = sushiSelect.value;

    if (!name || !gender || !sushi) 
    {
      alert("⚠️ Please fill out all required fields!");
      return;
    }

    let summary = `🍣 Sushi Booking Summary\n\n`;
    summary += `👤 Name: ${name}\n`;
    summary += `🚻 Gender: ${gender}\n`;
    summary += `🍱 Sushi: ${sushi}\n`;

    if (sushi === "Orchid Princess Roll Sushi" && gender === "Female") 
    {
      const celebration = document.getElementById("celebration").value;
      const note = document.getElementById("note").value.trim();
      summary += `🎉 Celebration: ${celebration || "Not specified"}\n`;
      summary += `📝 Note: ${note || "No note"}\n`;
    }

  summary += `\nThanks for your order! Please come again!`;

  summaryDiv.style.display = "block";
  summaryDiv.style.whiteSpace = "pre-line";
  summaryDiv.style.color = "green";
  summaryDiv.textContent = summary;

    form.reset();
    orchidSection.style.display = "none";
  });
});

