import type {
  BiomarkerStatus,
  VerifiedClinicalEvaluation,
} from './types';

function mapFhirInterpretation(status: BiomarkerStatus): { code: string; display: string } {
  switch (status) {
    case 'critical_high':
      return { code: 'HH', display: 'Critical high' };
    case 'critical_low':
      return { code: 'LL', display: 'Critical low' };
    case 'high':
    case 'borderline_high':
      return { code: 'H', display: 'High' };
    case 'low':
    case 'borderline_low':
      return { code: 'L', display: 'Low' };
    case 'normal':
      return { code: 'N', display: 'Normal' };
    default:
      return { code: 'IND', display: 'Indeterminate' };
  }
}

function mapFhirSeverity(severity: 'critical' | 'major' | 'moderate'): 'high' | 'moderate' | 'low' {
  if (severity === 'critical' || severity === 'major') return 'high';
  return 'moderate';
}

/**
 * Generates an HL7 FHIR R4 Bundle (Malaffi / Abu Dhabi DoH HIE interoperable)
 * containing Patient, Observation (LOINC + UCUM), DiagnosticReport,
 * MedicationStatement, and DetectedIssue resources.
 */
export function buildFhirR4Bundle(evaluation: VerifiedClinicalEvaluation) {
  const timestamp = new Date().toISOString();
  const patientId = 'patient-shifaclear-1';
  const approxBirthYear = new Date().getFullYear() - evaluation.patientContext.age;

  const entries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [
    {
      fullUrl: `urn:uuid:${patientId}`,
      resource: {
        resourceType: 'Patient',
        id: patientId,
        gender: evaluation.patientContext.sex,
        birthDate: `${approxBirthYear}`,
        communication: [
          {
            language: {
              coding: [
                {
                  system: 'urn:ietf:bcp:47',
                  code: evaluation.patientContext.language,
                },
              ],
            },
            preferred: true,
          },
        ],
      },
    },
  ];

  const observationRefs: Array<{ reference: string; display: string }> = [];

  for (const bio of evaluation.biomarkers) {
    const obsId = `obs-${bio.canonicalId}`;
    const interp = mapFhirInterpretation(bio.status);
    observationRefs.push({
      reference: `urn:uuid:${obsId}`,
      display: bio.displayName,
    });

    const referenceRange: Array<Record<string, unknown>> = [];
    if (bio.refLowSI !== undefined || bio.refHighSI !== undefined) {
      const rangeEntry: Record<string, unknown> = { text: bio.refLabelSI };
      if (bio.refLowSI !== undefined) {
        rangeEntry.low = { value: bio.refLowSI, unit: bio.siUnit };
      }
      if (bio.refHighSI !== undefined) {
        rangeEntry.high = { value: bio.refHighSI, unit: bio.siUnit };
      }
      referenceRange.push(rangeEntry);
    }

    entries.push({
      fullUrl: `urn:uuid:${obsId}`,
      resource: {
        resourceType: 'Observation',
        id: obsId,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory',
              },
            ],
          },
        ],
        code: {
          coding: bio.loincCode
            ? [
                {
                  system: 'http://loinc.org',
                  code: bio.loincCode,
                  display: bio.displayName,
                },
              ]
            : undefined,
          text: bio.displayName,
        },
        subject: { reference: `urn:uuid:${patientId}` },
        effectiveDateTime: evaluation.reportDate || timestamp.slice(0, 10),
        valueQuantity: {
          value: bio.siValue,
          unit: bio.siUnit,
          system: 'http://unitsofmeasure.org',
          code: bio.siUnit,
        },
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: interp.code,
                display: interp.display,
              },
            ],
          },
        ],
        referenceRange: referenceRange.length > 0 ? referenceRange : undefined,
      },
    });
  }

  if (observationRefs.length > 0) {
    entries.push({
      fullUrl: 'urn:uuid:diag-report-1',
      resource: {
        resourceType: 'DiagnosticReport',
        id: 'diag-report-1',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'LAB',
                display: 'Laboratory',
              },
            ],
          },
        ],
        code: {
          text: evaluation.facilityName
            ? `Verified Clinical Lab Summary — ${evaluation.facilityName}`
            : 'ShifaClear Verified Clinical Lab Summary',
        },
        subject: { reference: `urn:uuid:${patientId}` },
        effectiveDateTime: evaluation.reportDate || timestamp.slice(0, 10),
        issued: timestamp,
        result: observationRefs,
      },
    });
  }

  for (const med of evaluation.medications) {
    entries.push({
      fullUrl: `urn:uuid:${med.id}`,
      resource: {
        resourceType: 'MedicationStatement',
        id: med.id,
        status: 'active',
        medicationCodeableConcept: {
          text: `${med.brandName} (${med.genericName}) ${med.dose}`,
        },
        subject: { reference: `urn:uuid:${patientId}` },
        dosage: [
          {
            text: `${med.dose} ${med.frequencyRaw} (${med.slots.join(', ')}) — ${med.timingInstruction}`,
          },
        ],
      },
    });
  }

  for (const alert of evaluation.alerts) {
    entries.push({
      fullUrl: `urn:uuid:${alert.id}`,
      resource: {
        resourceType: 'DetectedIssue',
        id: alert.id,
        status: 'final',
        code: {
          coding: [
            {
              system: 'https://shifaclear.health/clinical-rules',
              code: alert.ruleId,
              display: alert.title,
            },
          ],
          text: alert.title,
        },
        severity: mapFhirSeverity(alert.severity),
        patient: { reference: `urn:uuid:${patientId}` },
        identifiedDateTime: timestamp,
        detail: alert.clinicalRationale,
        mitigation: [
          {
            action: {
              text: alert.recommendedAction,
            },
          },
        ],
      },
    });
  }

  return {
    resourceType: 'Bundle',
    id: 'shifaclear-malaffi-r4-bundle',
    meta: {
      lastUpdated: timestamp,
      profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'],
      tag: [
        {
          system: 'https://malaffi.ae/fhir/tags',
          code: 'shifaclear-verified-clinical-summary',
          display: 'ShifaClear MD-Guardrailed Patient Summary (Malaffi-Ready)',
        },
      ],
    },
    type: 'collection',
    timestamp,
    total: entries.length,
    entry: entries,
  };
}
