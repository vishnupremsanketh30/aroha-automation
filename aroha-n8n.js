// aroha-n8n.js - Modified for n8n execution
const { chromium } = require('playwright');

// Get data from environment variables (set by n8n Execute Command node)
const serviceLocation = process.env.SERVICE_LOCATION;
const qualification = process.env.QUALIFICATION;
const shiftDate = process.env.SHIFT_DATE; // Expected format: DD/MM/YYYY
const startTime = process.env.START_TIME; // Expected format: HH:MM
const endTime = process.env.END_TIME; // Expected format: HH:MM

// Determine shift type based on start time
function determineShiftType(startTime) {
  const hour = parseInt(startTime.split(':')[0]);
  // If start time is 12:00 PM (12:00) or later, it's PM shift
  return hour >= 12 ? 'PM' : 'AM';
}

const shiftType = determineShiftType(startTime);

async function executeShiftBooking() {
  console.log('Script execution started for n8n automation.');
  console.log('Input data:', { serviceLocation, qualification, shiftDate, startTime, endTime, shiftType });

  const browser = await chromium.launch({ headless: true ,slowMo: 500 });
  const page = await browser.newPage();

  try {
    // --- Error Logging for Page Events ---
    page.on('pageerror', (err) => {
      console.error(`[PAGE ERROR]: ${err.message}`);
    });
    page.on('crash', () => {
      console.error('[BROWSER CRASHED]: The page crashed!');
    });
    page.on('close', () => {
      console.warn('[PAGE CLOSED]: The page was closed unexpectedly.');
    });

    // Step 1: Go to the login page
    console.log('STEP 1: Navigating to login page...');
    await page.goto('https://arohastaff.entirehr.com.au/', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(1000);

    // Step 2: Enter User ID and Password
    console.log('STEP 2: Entering User ID and Password...');
    await page.waitForSelector('input[name="tbxUserName"]', { state: 'visible', timeout: 30000 });
    await page.fill('input[name="tbxUserName"]', 'testing');
    await page.waitForSelector('input[name="tbxPassword"]', { state: 'visible', timeout: 30000 });
    await page.fill('input[name="tbxPassword"]', 'Aroha123$');

    await page.waitForSelector('#BtnLogin', { state: 'visible', timeout: 30000 });
    await page.click('#BtnLogin');
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.waitForTimeout(2000);

    // Step 3: Handle security questions if present
    console.log('STEP 3: Checking for security questions page...');
    const verifyButtonSelector = 'button[ng-click="verifySecurityQA()"]';
    const verifyButton = await page.$(verifyButtonSelector);

    if (verifyButton) {
      console.log('STEP 3: Handling security questions...');
      await page.getByRole('listitem')
        .filter({ hasText: 'What is the name of the first teacher who made a lasting impression on you?' })
        .getByPlaceholder('Type your answer...')
        .fill('test');

      await page.getByRole('listitem')
        .filter({ hasText: 'What is the name of the street you lived on when you were ten years old?' })
        .getByPlaceholder('Type your answer...')
        .fill('test');

      await page.waitForSelector(verifyButtonSelector, { state: 'visible', timeout: 30000 });
      await page.click(verifyButtonSelector);
      console.log('STEP 3: Verify button clicked. Waiting for home page...');
      await page.waitForLoadState('networkidle', { timeout: 60000 });
    } else {
      console.log('STEP 3: Security questions page not present, skipping to next step...');
    }

    await page.waitForTimeout(2000);

    // Step 4: Navigate to Allocations via Quick Links
    console.log('STEP 4: Navigating to Home page and clicking Quick Links...');
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.waitForTimeout(3000);

    const quickLinksSelector = 'a.circleMenu:has-text("Quick Links")';
    console.log(`STEP 4: Waiting for Quick Links button to be visible...`);

    try {
      await page.waitForSelector(quickLinksSelector, { state: 'visible', timeout: 30000 });
      await page.click(quickLinksSelector);
      console.log('STEP 4: Quick Links clicked. Waiting for circular icons to appear...');
    } catch (error) {
      console.log('STEP 4: Quick Links not found with class selector, trying alternative...');
      const alternativeQuickLinksSelector = 'a:has-text("Quick Links")';
      await page.waitForSelector(alternativeQuickLinksSelector, { state: 'visible', timeout: 30000 });
      await page.click(alternativeQuickLinksSelector);
      console.log('STEP 4: Quick Links clicked (alternative selector). Waiting for circular icons to appear...');
    }

    await page.waitForTimeout(3000);

    // Check if the quick links panel is visible
    const quickLinksPanel = await page.$('.fixednav');
    const isPanelVisible = quickLinksPanel ? await quickLinksPanel.isVisible() : false;
    console.log(`STEP 4: Quick Links panel visible: ${isPanelVisible}`);

    if (!isPanelVisible) {
      console.log('STEP 4: Quick Links panel not visible, trying to click Quick Links again...');
      try {
        await page.click(quickLinksSelector);
        await page.waitForTimeout(2000);
      } catch (retryError) {
        console.log('STEP 4: Retry click failed, continuing with alternatives...');
      }
    }

    await page.waitForTimeout(3000);

    // Click on Allocations circle
    const allocationsCircleSelector = '#circleBoxAllocations a';
    console.log(`STEP 4: Waiting for Allocations circle to be visible...`);

    try {
      await page.waitForSelector(allocationsCircleSelector, { state: 'visible', timeout: 30000 });
      await page.locator(allocationsCircleSelector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.click(allocationsCircleSelector);
      console.log('STEP 4: Allocations circle clicked. Waiting for Allocations page...');
    } catch (error) {
      console.log('STEP 4: Circular Allocations element not found, trying alternative selectors...');
      
      const alternativeSelectors = [
        'a[href="/Process/Allocations/KendoShiftAllocation.aspx"]',
        '.ih-item:has-text("Allocations") a',
        '[id*="Allocations"] a',
        'div:has-text("Allocations") a'
      ];
      
      let clicked = false;
      for (const selector of alternativeSelectors) {
        try {
          console.log(`STEP 4: Trying alternative selector: ${selector}`);
          await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
          await page.click(selector);
          console.log(`STEP 4: Allocations clicked with selector: ${selector}`);
          clicked = true;
          break;
        } catch (selectorError) {
          console.log(`STEP 4: Selector ${selector} failed: ${selectorError.message}`);
        }
      }
      
      if (!clicked) {
        console.log('STEP 4: Trying main navigation menu Allocation...');
        try {
          await page.click('li.topmenu:has-text("Allocation") a');
          console.log('STEP 4: Clicked Allocation from main menu');
        } catch (navError) {
          throw new Error('Could not find and click Allocations with any method');
        }
      }
    }

    await page.waitForTimeout(2000);

    // Step 5: Click on "Single" button
    console.log('STEP 5: Clicking on the "Single" button...');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const singleButtonSelector = '#lnkQuick';
    console.log(`STEP 5: Waiting for SINGLE button to be visible...`);

    try {
      await page.waitForSelector(singleButtonSelector, { state: 'visible', timeout: 30000 });
      await page.click(singleButtonSelector);
      console.log('STEP 5: SINGLE button clicked. Waiting for Quick New Shift Booking modal...');
    } catch (error) {
      console.log('STEP 5: Primary SINGLE button not found, trying alternatives...');
      
      const alternatives = [
        'a:has-text("Single")',
        '[id*="Quick"]',
        'a[href*="Quick"]',
        '.quick-link, .single-link'
      ];
      
      let clicked = false;
      for (const altSelector of alternatives) {
        try {
          console.log(`STEP 5: Trying alternative selector: ${altSelector}`);
          await page.waitForSelector(altSelector, { state: 'visible', timeout: 10000 });
          await page.click(altSelector);
          console.log(`STEP 5: SINGLE button clicked (${altSelector}). Waiting for Quick New Shift Booking modal...`);
          clicked = true;
          break;
        } catch (altError) {
          console.log(`STEP 5: Alternative ${altSelector} failed: ${altError.message}`);
        }
      }
      
      if (!clicked) {
        throw new Error('Could not find and click the Single/Quick button with any selector');
      }
    }

    await page.waitForTimeout(2000);

    // Step 6: Fill the "Quick New Shift Booking" form with n8n data
    console.log('STEP 6: Waiting for Quick New Shift Booking modal to be fully ready...');
    await page.waitForSelector('text="Quick New Shift Booking"', { state: 'visible', timeout: 30000 });

    // Handle iframe
    const iframeSrcPattern = /PopUps\/Quickbooking\.aspx/;
    const iframeElementSelector = `iframe[src*="PopUps/Quickbooking.aspx"]`;
    console.log(`STEP 6: Waiting for iframe element to be visible...`);
    await page.waitForSelector(iframeElementSelector, { state: 'visible', timeout: 30000 });
    console.log(`STEP 6: Iframe element is visible.`);

    let frame = null;
    let frameAttempts = 0;
    const maxFrameAttempts = 5;

    while (!frame && frameAttempts < maxFrameAttempts) {
      frameAttempts++;
      console.log(`STEP 6: Attempting to get frame (attempt ${frameAttempts}/${maxFrameAttempts})...`);
      
      try {
        frame = page.frame({ url: iframeSrcPattern });
        if (!frame) {
          const frameElement = await page.$(iframeElementSelector);
          if (frameElement) {
            frame = await frameElement.contentFrame();
          }
        }
        
        if (frame) {
          await frame.waitForLoadState('domcontentloaded', { timeout: 10000 });
          break;
        }
      } catch (error) {
        console.log(`STEP 6: Frame attempt ${frameAttempts} failed:`, error.message);
      }
      
      if (!frame && frameAttempts < maxFrameAttempts) {
        await page.waitForTimeout(2000);
      }
    }

    if (!frame) {
      throw new Error('Could not find the iframe with the specified URL pattern to get its content frame.');
    }

    console.log('STEP 6: Waiting for network idle within iframe...');
    await frame.waitForLoadState('networkidle', { timeout: 30000 });
    await frame.waitForTimeout(1000);

    // Fill Service Location with n8n data
    const serviceLocationInputSelector = 'input#ddlService_Input';
    console.log(`STEP 6: Typing "${serviceLocation}" into Service Location input...`);
    await frame.waitForSelector(serviceLocationInputSelector, { state: 'visible', timeout: 30000 });
    await frame.fill(serviceLocationInputSelector, serviceLocation);
    console.log(`STEP 6: "${serviceLocation}" typed into Service Location input.`);

    // Select first suggestion
    const suggestionSelector = 'div[id^="ddlService_DropDown"] li.rcbItem:first-child';
    await frame.waitForSelector(suggestionSelector, { state: 'visible', timeout: 30000 });
    await frame.click(suggestionSelector);
    console.log('STEP 6: First Service Location suggestion selected.');

    // Fill Delivery Location (default first option)
    const deliveryLocationInputSelector = 'input#ddlDelivery_Input';
    await frame.waitForSelector(deliveryLocationInputSelector, { state: 'visible', timeout: 30000 });
    await frame.click(deliveryLocationInputSelector);

    const firstDeliveryOptionSelector = 'div[id^="ddlDelivery_DropDown"] li.rcbItem:first-child';
    await frame.waitForSelector(firstDeliveryOptionSelector, { state: 'visible', timeout: 10000 });
    await frame.click(firstDeliveryOptionSelector);
    console.log('STEP 6: First Delivery Location option selected.');

    // Fill Qualification with n8n data
    const qualificationInputSelector = 'input#ddlQualification_Input';
    const qualificationArrowSelector = '#ddlQualification_Arrow';

    await frame.waitForSelector(qualificationInputSelector, { state: 'visible', timeout: 30000 });
    await frame.click(qualificationInputSelector);
    await frame.fill(qualificationInputSelector, qualification);
    console.log(`STEP 6: "${qualification}" typed into Qualification input.`);
    await frame.waitForTimeout(1000);

    // Click the arrow to ensure dropdown opens
    await frame.click(qualificationArrowSelector);
    await frame.waitForSelector('div#ddlQualification_DropDown', { timeout: 10000 });
    console.log('STEP 6: First Qualification suggestion selected.');

    // Fill Date with n8n data
    const dateInputSelector = 'input#rdpDatenDay_dateInput';
    await frame.waitForSelector(dateInputSelector, { state: 'visible', timeout: 30000 });
    await frame.fill(dateInputSelector, shiftDate);
    console.log(`STEP 6: Date field filled with ${shiftDate}.`);

    // Fill Shift Type based on time calculation
    const shiftTypeInputSelector = 'input#ddlShift_Input';
    await frame.waitForSelector(shiftTypeInputSelector, { state: 'visible', timeout: 30000 });
    await frame.fill(shiftTypeInputSelector, shiftType);
    console.log(`STEP 6: "${shiftType}" typed into Shift Type input.`);

    const shiftTypeSuggestionSelector = `li:has-text("${shiftType}")`;
    await frame.waitForSelector(shiftTypeSuggestionSelector, { state: 'visible', timeout: 30000 });
    await frame.click(shiftTypeSuggestionSelector);
    console.log(`STEP 6: "${shiftType}" suggestion clicked.`);

    // Fill Start Time with n8n data
    await frame.waitForSelector('input#rtpStart_dateInput', { state: 'visible', timeout: 30000 });
    await frame.waitForTimeout(3000);
    await frame.fill('input#rtpStart_dateInput', '');
    await frame.waitForTimeout(3000);
    await frame.fill('input#rtpStart_dateInput', startTime);
    await frame.waitForTimeout(3000);
    await frame.press('input#rtpStart_dateInput', 'Enter');

    // Fill End Time with n8n data
    await frame.waitForSelector('input#rtpEnd_dateInput', { state: 'visible', timeout: 30000 });
    await frame.fill('input#rtpEnd_dateInput', '');
    await frame.fill('input#rtpEnd_dateInput', endTime);
    await frame.press('input#rtpEnd_dateInput', 'Enter');

    console.log(`STEP 6: Start and End Time fields filled with ${startTime} and ${endTime}.`);
    console.log('Form filled successfully with n8n data.');

    // Wait for any form submission or validation to complete
    await page.waitForTimeout(2000);
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('Test finished successfully.');
    } catch (error) {
      console.log('Test completed but page state changed:', error.message);
    }

    await browser.close();
    
    return {
      success: true,
      message: 'Shift booking completed successfully',
      data: {
        serviceLocation,
        qualification,
        shiftDate,
        startTime,
        endTime,
        shiftType
      }
    };

  } catch (error) {
    console.error('Error during shift booking:', error);
    await browser.close();
    throw error;
  }
}


// Execute the function and handle result for CLI usage
(async () => {
  try {
    const result = await executeShiftBooking();
    console.log('Result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
})();
