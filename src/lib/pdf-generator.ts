import jsPDF from 'jspdf';

interface StudySession {
  time: string;
  duration: number;
  subject: string;
  activity: string;
  tip: string;
}

interface StudyPlan {
  id?: string;
  title: string;
  weeklySchedule: Record<string, StudySession[]>;
  weeklyGoals: string[];
  recommendations: string[];
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function generateStudyPlanPDF(plan: StudyPlan): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper to add new page if needed
  const checkNewPage = (height: number) => {
    if (yPos + height > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(plan.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Weekly Study Schedule', pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  yPos += 15;

  // Stats summary
  let totalHours = 0;
  let activeDays = 0;
  Object.values(plan.weeklySchedule || {}).forEach(sessions => {
    if (sessions.length > 0) activeDays++;
    sessions.forEach(s => totalHours += s.duration);
  });
  totalHours = Math.round(totalHours / 60 * 10) / 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statsText = `${totalHours} hours/week • ${activeDays} study days • ${plan.weeklyGoals?.length || 0} goals`;
  doc.text(statsText, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Weekly Goals Section
  if (plan.weeklyGoals && plan.weeklyGoals.length > 0) {
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Goals', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    plan.weeklyGoals.forEach((goal, index) => {
      checkNewPage(8);
      doc.text(`• ${goal}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 10;
  }

  // Schedule Section
  DAYS_ORDER.forEach(day => {
    const sessions = plan.weeklySchedule?.[day] || [];
    if (sessions.length === 0) return;

    checkNewPage(30);
    
    // Day header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
    doc.text(day, margin + 5, yPos + 2);
    yPos += 12;

    // Sessions
    sessions.forEach((session, index) => {
      checkNewPage(25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${session.time} (${session.duration} min)`, margin + 5, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text(session.subject, margin + 5, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      const activityLines = doc.splitTextToSize(session.activity, pageWidth - 2 * margin - 10);
      doc.text(activityLines, margin + 5, yPos);
      yPos += activityLines.length * 5;
      
      if (session.tip) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        const tipLines = doc.splitTextToSize(`💡 ${session.tip}`, pageWidth - 2 * margin - 15);
        doc.text(tipLines, margin + 10, yPos);
        yPos += tipLines.length * 4 + 3;
        doc.setTextColor(0);
      }
      
      yPos += 5;
    });
    yPos += 5;
  });

  // Recommendations Section
  if (plan.recommendations && plan.recommendations.length > 0) {
    checkNewPage(30);
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Recommendations', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    plan.recommendations.forEach((rec) => {
      checkNewPage(15);
      const recLines = doc.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin - 5);
      doc.text(recLines, margin + 5, yPos);
      yPos += recLines.length * 5 + 3;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`${plan.title.replace(/[^a-z0-9]/gi, '_')}_study_plan.pdf`);
}
