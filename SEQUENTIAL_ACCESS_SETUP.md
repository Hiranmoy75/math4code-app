# Sequential Exam Access - Setup Guide

## ✅ Implementation Complete

Sequential exam access has been added to the mobile app! Students must now complete exams in order.

## How It Works

The system checks:
1. If the exam is part of a lesson with `sequential_unlock_enabled = true`
2. If the lesson has a `prerequisite_lesson_id` set
3. If the student has completed the prerequisite lesson's exam

If any prerequisite is not met, the student sees a "Prerequisite Required" screen.

## Database Setup Required

To enable sequential access for your exams, you need to configure the lessons table:

### Step 1: Check if columns exist

Run this query to check if the prerequisite columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name IN ('prerequisite_lesson_id', 'sequential_unlock_enabled');
```

### Step 2: Add columns if missing

If the columns don't exist, add them:

```sql
-- Add prerequisite_lesson_id column
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS prerequisite_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;

-- Add sequential_unlock_enabled column
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS sequential_unlock_enabled boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_prerequisite_lesson_id 
ON public.lessons(prerequisite_lesson_id);
```

### Step 3: Enable sequential access for your lessons

For each lesson that should require the previous one to be completed:

```sql
-- Example: Make Lesson 2 require Lesson 1 to be completed first
UPDATE public.lessons 
SET 
    sequential_unlock_enabled = true,
    prerequisite_lesson_id = (
        SELECT id FROM public.lessons 
        WHERE title = 'Lesson 1 Quiz' -- Replace with actual previous lesson title
        LIMIT 1
    )
WHERE title = 'Lesson 2 Quiz'; -- Replace with actual current lesson title
```

### Step 4: Set up sequential chain

For a course with multiple lessons in sequence:

```sql
-- Get all quiz lessons in order
SELECT id, title, lesson_order 
FROM public.lessons 
WHERE content_type = 'quiz' 
AND module_id = 'your-module-id' -- Replace with actual module ID
ORDER BY lesson_order;

-- Then for each lesson (starting from the 2nd one), run:
UPDATE public.lessons 
SET 
    sequential_unlock_enabled = true,
    prerequisite_lesson_id = 'previous-lesson-id' -- ID from previous lesson
WHERE id = 'current-lesson-id';
```

## Testing

### Test 1: Verify Prerequisite Blocking

1. Create two quiz lessons in sequence
2. Enable sequential unlock on Lesson 2
3. Set Lesson 1 as prerequisite for Lesson 2
4. In the mobile app, try to access Lesson 2's exam without completing Lesson 1
5. **Expected**: See "Prerequisite Required" screen with Lesson 1's title

### Test 2: Verify Access After Completion

1. Complete Lesson 1's exam
2. Try to access Lesson 2's exam
3. **Expected**: Can now start Lesson 2's exam

### Test 3: Verify Non-Sequential Lessons

1. Create a lesson without `sequential_unlock_enabled`
2. Try to access its exam
3. **Expected**: Can access immediately (no prerequisite check)

## Troubleshooting

### Issue: All exams are accessible (no blocking)

**Possible causes:**
- `sequential_unlock_enabled` is `false` or `null`
- `prerequisite_lesson_id` is not set
- Exam is not linked to a lesson (lesson.exam_id is null)
- Lesson content_type is not 'quiz'

**Solution:**
```sql
-- Check lesson configuration
SELECT 
    l.id,
    l.title,
    l.content_type,
    l.exam_id,
    l.sequential_unlock_enabled,
    l.prerequisite_lesson_id,
    e.title as exam_title
FROM lessons l
LEFT JOIN exams e ON l.exam_id = e.id
WHERE l.content_type = 'quiz'
ORDER BY l.lesson_order;
```

### Issue: Exam is blocked even after completing prerequisite

**Possible causes:**
- Exam attempt status is not 'submitted'
- Wrong prerequisite_lesson_id configured

**Solution:**
```sql
-- Check student's exam attempts
SELECT 
    ea.id,
    ea.status,
    e.title as exam_title,
    l.title as lesson_title
FROM exam_attempts ea
JOIN exams e ON ea.exam_id = e.id
JOIN lessons l ON l.exam_id = e.id
WHERE ea.student_id = 'student-id' -- Replace with actual student ID
ORDER BY ea.created_at DESC;
```

## Quick Setup Example

Here's a complete example for a course with 3 sequential quizzes:

```sql
-- Assuming you have 3 lessons with exams already created
-- Get the lesson IDs
WITH quiz_lessons AS (
    SELECT id, title, lesson_order
    FROM lessons
    WHERE content_type = 'quiz'
    AND module_id = 'your-module-id'
    ORDER BY lesson_order
)
-- Enable sequential access for lessons 2 and 3
UPDATE lessons l
SET 
    sequential_unlock_enabled = true,
    prerequisite_lesson_id = (
        SELECT id FROM quiz_lessons 
        WHERE lesson_order = l.lesson_order - 1
    )
FROM quiz_lessons ql
WHERE l.id = ql.id
AND ql.lesson_order > 1;
```

## Console Logs

When testing, check the console for helpful logs:

- `✅ Login successful` - Authentication working
- Prerequisite checks happen during `checkExamEligibility`
- Look for any error messages about missing columns or data

## Next Steps

1. Run the database setup queries above
2. Configure your lessons with sequential unlock
3. Test in the mobile app
4. Verify students see the prerequisite screen when appropriate

---

**Note:** The mobile app now matches the website's sequential access behavior!
